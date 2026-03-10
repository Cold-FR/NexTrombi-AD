<?php

namespace App\Controller;

use App\Entity\UserPhoto;
use App\Repository\UserPhotoRepository;
use App\Service\LdapConnection;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use LdapRecord\Models\ActiveDirectory\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ApiController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(APP_LDAP_USERS_OU)%')] private readonly string $usersOu,
        #[Autowire('%env(APP_PHOTO_STORAGE_MODE)%')] private readonly string $photoStorageMode,
    ) {
    }

    #[Route('/api/users', name: 'api_users', methods: ['GET'])]
    public function getUsers(LdapConnection $ldapConnection, UserPhotoRepository $photoRepo, Request $request): JsonResponse
    {
        $ldapConnection->getConnection();

        try {
            $nowFileTime = (time() + 11644473600) * 10000000;

            // On récupère les utilisateurs AD
            $results = User::in($this->usersOu)
                ->rawFilter('(!(userAccountControl:1.2.840.113556.1.4.803:=2))')
                ->rawFilter(sprintf('(|(accountExpires=0)(accountExpires=9223372036854775807)(accountExpires>=%d))', $nowFileTime))
                ->whereHas('sn')
                ->whereHas('givenname')
                // On demande explicitement l'attribut thumbnailphoto pour optimiser la requête LDAP
                ->select(['samaccountname', 'givenname', 'sn', 'title', 'department', 'mail', 'telephonenumber', 'thumbnailphoto'])
                ->get();

            // Si mode 'local', on précharge la base de données
            $photoMap = [];
            $baseUrl = $request->getSchemeAndHttpHost();

            if ('local' === $this->photoStorageMode) {
                $photosDb = $photoRepo->findAll();
                foreach ($photosDb as $photo) {
                    $photoMap[$photo->getLdapUsername()] = $photo->getPhotoFilename();
                }
            }

            $users = [];

            // Formatage des données
            foreach ($results as $entry) {
                $samaccountname = $entry->getFirstAttribute('samaccountname');
                $photoUrl = null;

                // --- LE CHOIX DU MODE EST ICI ---
                if ('ad' === $this->photoStorageMode) {
                    // Mode AD : on lit le binaire et on le transforme en Base64
                    $photoBinaire = $entry->getFirstAttribute('thumbnailphoto');
                    if ($photoBinaire) {
                        $photoUrl = 'data:image/jpeg;base64,'.base64_encode($photoBinaire);
                    }
                } else {
                    // Mode Local : on cherche dans notre tableau PHP construit depuis la BDD
                    if (isset($photoMap[$samaccountname])) {
                        $photoUrl = $baseUrl.'/uploads/photos/'.$photoMap[$samaccountname];
                    }
                }

                $users[] = [
                    'id' => $samaccountname,
                    'firstName' => $entry->getFirstAttribute('givenname'),
                    'lastName' => $entry->getFirstAttribute('sn'),
                    'jobTitle' => $entry->getFirstAttribute('title') ?? 'Agent',
                    'department' => $entry->getFirstAttribute('department') ?? 'Non renseigné',
                    'email' => $entry->getFirstAttribute('mail') ?? '',
                    'phone' => $entry->getFirstAttribute('telephonenumber') ?? '',
                    'photoUrl' => $photoUrl,
                ];
            }

            // Tri par ordre alphabétique sur le nom de famille
            usort($users, fn ($a, $b) => strcmp($a['lastName'], $b['lastName']));

            return $this->json($users);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur LDAP : '.$e->getMessage()], 503);
        }
    }

    #[Route('/api/users/{id}/photo', name: 'api_upload_photo', methods: ['POST'])]
    public function uploadPhoto(
        string $id,
        Request $request,
        UploadService $uploadService,
        LdapConnection $ldapConnection,
        UserPhotoRepository $photoRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        $file = $request->files->get('photo');

        if (!$file) {
            return $this->json(['error' => 'Aucune image trouvée dans la requête.'], 400);
        }

        try {
            if ('ad' === $this->photoStorageMode) {
                // --- MODE ACTIVE DIRECTORY ---
                $ldapConnection->getConnection();

                // On récupère le binaire JPEG
                $binaryJpeg = $uploadService->handleAdUpload($file);

                // On cherche l'utilisateur dans l'AD
                $user = User::findBy('samaccountname', $id);
                if (!$user) {
                    return $this->json(['error' => 'Utilisateur introuvable dans l\'AD.'], 404);
                }

                // On écrase l'attribut (LdapRecord gère l'encodage binaire tout seul)
                $user->thumbnailphoto = $binaryJpeg;
                $user->save();

                // On renvoie l'image en Base64 pour que React l'affiche direct
                $newPhotoUrl = 'data:image/jpeg;base64,'.base64_encode($binaryJpeg);
            } else {
                // --- MODE LOCAL (Base de données) ---
                $newFilename = $uploadService->handleLocalUpload($file);

                // On cherche s'il a déjà une photo en base
                $userPhoto = $photoRepo->findOneBy(['ldapUsername' => $id]);

                if (!$userPhoto) {
                    $userPhoto = new UserPhoto();
                    $userPhoto->setLdapUsername($id);
                } else {
                    // Supprimer l'ancienne image physique si elle existe
                    $oldPath = $this->getParameter('kernel.project_dir').'/public/uploads/photos/'.$userPhoto->getPhotoFilename();
                    $fileSys = new Filesystem();
                    if ($fileSys->exists($oldPath)) {
                        $fileSys->remove($oldPath);
                    }
                }

                $userPhoto->setPhotoFilename($newFilename);
                $em->persist($userPhoto);
                $em->flush();

                $newPhotoUrl = $request->getSchemeAndHttpHost().'/uploads/photos/'.$newFilename;
            }

            return $this->json([
                'message' => 'Photo mise à jour avec succès',
                'photoUrl' => $newPhotoUrl,
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
