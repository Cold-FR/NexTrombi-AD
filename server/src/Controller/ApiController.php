<?php

namespace App\Controller;

use App\Service\LdapConnection;
use LdapRecord\Models\ActiveDirectory\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class ApiController extends AbstractController
{
    public function __construct(
        #[Autowire('%env(APP_LDAP_USERS_OU)%')] private readonly string $usersOu,
    ) {}

    #[Route('/api/users', name: 'api_users', methods: ['GET'])]
    public function getUsers(LdapConnection $ldapConnection): JsonResponse
    {
        // 1. Initialise la connexion LDAP
        $ldapConnection->getConnection();

        try {
            // Timestamp pour exclure les comptes expirés
            $nowFileTime = (time() + 11644473600) * 10000000;

            // 2. Requête LdapRecord
            $results = User::in($this->usersOu)
                // On exclut les comptes désactivés
                ->rawFilter('(!(userAccountControl:1.2.840.113556.1.4.803:=2))')
                // On exclut les comptes expirés
                ->rawFilter(sprintf(
                    '(|(accountExpires=0)(accountExpires=9223372036854775807)(accountExpires>=%d))',
                    $nowFileTime
                ))
                // On s'assure qu'ils ont au moins un nom de famille (sn) et un prénom (givenname)
                ->whereHas('sn')
                ->whereHas('givenname')
                ->get();

            $users = [];

            // 3. Formatage des données pour coller EXACTEMENT au type React "User"
            foreach ($results as $entry) {
                // LdapRecord retourne des tableaux pour chaque attribut, on prend le premier élément
                $samaccountname = $entry->getFirstAttribute('samaccountname');

                $users[] = [
                    'id' => $samaccountname,
                    'firstName' => $entry->getFirstAttribute('givenname'),
                    'lastName' => $entry->getFirstAttribute('sn'),
                    'jobTitle' => $entry->getFirstAttribute('title') ?? 'Agent', // Poste
                    'department' => $entry->getFirstAttribute('department') ?? 'Non renseigné',
                    'email' => $entry->getFirstAttribute('mail') ?? '',
                    'phone' => $entry->getFirstAttribute('telephonenumber') ?? '',
                    'photoUrl' => null,
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
