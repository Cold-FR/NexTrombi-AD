<?php

namespace App\Controller;

use App\Entity\UserIgnore;
use App\Entity\UserPhoto;
use App\Repository\UserIgnoreRepository;
use App\Repository\UserPhotoRepository;
use App\Security\Voter\UserPhotoVoter;
use App\Service\LdapConnection;
use App\Service\UploadService;
use Doctrine\ORM\EntityManagerInterface;
use LdapRecord\Models\ActiveDirectory\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class ApiController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(APP_LDAP_USERS_OU)%')] private readonly string $usersOu,
        #[Autowire('%env(APP_PHOTO_STORAGE_MODE)%')] private readonly string $photoStorageMode,
        #[Autowire('%upload_folder%')] private readonly string $uploadFolder,
    ) {
    }

    #[IsGranted('ROLE_USER')]
    #[Route('/api/users', name: 'api_users', methods: ['GET'])]
    public function getUsers(UserPhotoRepository $photoRepo, UserIgnoreRepository $ignoreRepo): JsonResponse
    {
        $isAdmin = $this->isGranted('ROLE_ADMIN');

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

            // Construire un Set des usernames ignorés
            $ignoredUsernames = [];
            foreach ($ignoreRepo->findAll() as $ignore) {
                $ignoredUsernames[$ignore->getUsername()] = true;
            }

            $photoMap = [];
            if ('local' === $this->photoStorageMode) {
                foreach ($photoRepo->findAll() as $photo) {
                    $photoMap[$photo->getLdapUsername()] = $photo->getPhotoFilename();
                }
            }

            $users = [];

            // Formatage des données
            foreach ($results as $entry) {
                $samaccountname = $entry->getFirstAttribute('samaccountname');
                $isHidden = isset($ignoredUsernames[$samaccountname]);

                // Les non-admins ne voient pas du tout les users cachés
                if ($isHidden && !$isAdmin) {
                    continue;
                }

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
                        $photoUrl = $this->generateUrl('api_get_photo', ['filename' => $photoMap[$samaccountname]], UrlGeneratorInterface::ABSOLUTE_URL);
                    }
                }

                $user = [
                    'id' => $samaccountname,
                    'firstName' => $entry->getFirstAttribute('givenname'),
                    'lastName' => $entry->getFirstAttribute('sn'),
                    'jobTitle' => $entry->getFirstAttribute('title') ?? 'Agent',
                    'department' => $entry->getFirstAttribute('department') ?? 'Non renseigné',
                    'email' => $entry->getFirstAttribute('mail') ?? '',
                    'phone' => $entry->getFirstAttribute('telephonenumber') ?? '',
                    'photoUrl' => $photoUrl,
                ];

                // Le flag hidden n'est envoyé qu'aux admins
                if ($isAdmin) {
                    $user['hidden'] = $isHidden;
                }

                $users[] = $user;
            }

            usort($users, fn ($a, $b) => strcmp($a['lastName'], $b['lastName']));

            return $this->json($users);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur LDAP : '.$e->getMessage()], 503);
        }
    }

    /**
     * Toggle : si déjà ignoré → on retire, sinon → on ajoute.
     * Réservé aux admins.
     */
    #[IsGranted('ROLE_ADMIN')]
    #[Route('/api/users/{ldapUsername}/ignore', name: 'api_user_ignore_toggle', requirements: ['ldapUsername' => '.+'], methods: ['POST'])]
    public function toggleIgnoreUser(
        string $ldapUsername,
        UserIgnoreRepository $ignoreRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        $existing = $ignoreRepo->findOneBy(['username' => $ldapUsername]);

        if ($existing) {
            $em->remove($existing);
            $em->flush();

            return $this->json(['hidden' => false]);
        }

        $ignore = new UserIgnore();
        $ignore->setUsername($ldapUsername);
        $em->persist($ignore);
        $em->flush();

        return $this->json(['hidden' => true]);
    }

    #[IsGranted(UserPhotoVoter::UPLOAD, 'ldapUsername')]
    #[Route('/api/users/{ldapUsername}/photo', name: 'api_photo_upload', requirements: ['ldapUsername' => '.+'], methods: ['POST'])]
    public function uploadPhoto(
        string $ldapUsername,
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
                $user = User::findBy('samaccountname', $ldapUsername);
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
                $userPhoto = $photoRepo->findOneBy(['ldapUsername' => $ldapUsername]);

                if (!$userPhoto) {
                    $userPhoto = new UserPhoto();
                    $userPhoto->setLdapUsername($ldapUsername);
                } else {
                    // Supprimer l'ancienne image physique si elle existe
                    $oldPath = $this->uploadFolder.'/'.$userPhoto->getPhotoFilename();
                    $fileSys = new Filesystem();
                    if ($fileSys->exists($oldPath)) {
                        $fileSys->remove($oldPath);
                    }
                }

                $userPhoto->setPhotoFilename($newFilename);
                $em->persist($userPhoto);
                $em->flush();

                $newPhotoUrl = $this->generateUrl('api_get_photo', ['filename' => $newFilename], UrlGeneratorInterface::ABSOLUTE_URL);
            }

            return $this->json([
                'message' => 'Photo mise à jour avec succès',
                'photoUrl' => $newPhotoUrl,
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[IsGranted(UserPhotoVoter::DELETE, 'ldapUsername')]
    #[Route('/api/users/{ldapUsername}/photo', name: 'api_photo_delete', methods: ['DELETE'])]
    public function deletePhoto(
        string $ldapUsername,
        LdapConnection $ldapConnection,
        UserPhotoRepository $photoRepo,
        EntityManagerInterface $em,
    ): JsonResponse {
        try {
            if ('ad' === $this->photoStorageMode) {
                // --- MODE ACTIVE DIRECTORY ---
                $ldapConnection->getConnection();

                // On cherche l'utilisateur dans l'AD
                $user = User::findBy('samaccountname', $ldapUsername);
                if (!$user) {
                    return $this->json(['error' => 'Utilisateur introuvable dans l\'AD.'], 404);
                }

                // On écrase l'attribut (LdapRecord gère l'encodage binaire tout seul)
                $user->thumbnailphoto = null;
                $user->save();
            } else {
                // --- MODE LOCAL (Base de données) ---
                // On cherche s'il a déjà une photo en base
                $userPhoto = $photoRepo->findOneBy(['ldapUsername' => $ldapUsername]);

                if ($userPhoto) {
                    // Supprimer l'ancienne image physique si elle existe
                    $oldPath = $this->uploadFolder.'/'.$userPhoto->getPhotoFilename();
                    $fileSys = new Filesystem();
                    if ($fileSys->exists($oldPath)) {
                        $fileSys->remove($oldPath);
                    }

                    $em->remove($userPhoto);
                    $em->flush();
                }
            }

            return $this->json([
                'message' => 'Photo supprimée avec succès',
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/api/photos/{filename}', name: 'api_get_photo', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getPhoto(string $filename): BinaryFileResponse
    {
        $path = $this->uploadFolder.'/'.$filename;

        if (!file_exists($path)) {
            throw $this->createNotFoundException('Photo introuvable');
        }

        return new BinaryFileResponse($path);
    }
}
