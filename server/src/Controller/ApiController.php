<?php

namespace App\Controller;

use App\Repository\UserPhotoRepository;
use App\Service\LdapConnection;
use LdapRecord\Models\ActiveDirectory\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\Request;

class ApiController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(APP_LDAP_USERS_OU)%')] private readonly string $usersOu,
        #[Autowire('%env(APP_PHOTO_STORAGE_MODE)%')] private readonly string $photoStorageMode,
    ) {}

    #[Route('/api/users', name: 'api_users', methods: ['GET'])]
    public function getUsers(LdapConnection $ldapConnection, UserPhotoRepository $photoRepo, Request $request): JsonResponse
    {
        $ldapConnection->getConnection();

        try {
            $nowFileTime = (time() + 11644473600) * 10000000;

            // 1. On récupère les utilisateurs AD (Toujours obligatoire)
            $results = User::in($this->usersOu)
                ->rawFilter('(!(userAccountControl:1.2.840.113556.1.4.803:=2))')
                ->rawFilter(sprintf('(|(accountExpires=0)(accountExpires=9223372036854775807)(accountExpires>=%d))', $nowFileTime))
                ->whereHas('sn')
                ->whereHas('givenname')
                // On demande explicitement l'attribut thumbnailphoto pour optimiser la requête LDAP
                ->select(['samaccountname', 'givenname', 'sn', 'title', 'department', 'mail', 'telephonenumber', 'thumbnailphoto'])
                ->get();

            // 2. Si mode 'local', on précharge la base de données
            $photoMap = [];
            $baseUrl = $request->getSchemeAndHttpHost();

            if ($this->photoStorageMode === 'local') {
                $photosDb = $photoRepo->findAll();
                foreach ($photosDb as $photo) {
                    $photoMap[$photo->getLdapUsername()] = $photo->getPhotoFilename();
                }
            }

            $users = [];

            // 3. Formatage des données
            foreach ($results as $entry) {
                $samaccountname = $entry->getFirstAttribute('samaccountname');
                $photoUrl = null;

                // --- LE CHOIX DU MODE EST ICI ---
                if ($this->photoStorageMode === 'ad') {
                    // Mode AD : on lit le binaire et on le transforme en Base64
                    $photoBinaire = $entry->getFirstAttribute('thumbnailphoto');
                    if ($photoBinaire) {
                        $photoUrl = 'data:image/jpeg;base64,' . base64_encode($photoBinaire);
                    }
                } else {
                    // Mode Local : on cherche dans notre tableau PHP construit depuis la BDD
                    if (isset($photoMap[$samaccountname])) {
                        $photoUrl = $baseUrl . '/uploads/photos/' . $photoMap[$samaccountname];
                    }
                }
                // --------------------------------

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
            return $this->json(['error' => 'Erreur LDAP : ' . $e->getMessage()], 503);
        }
    }
}
