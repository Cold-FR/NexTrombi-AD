<?php

namespace App\Security;

use App\Service\LdapConnection;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * @implements UserProviderInterface<User>
 */
readonly class LdapJitUserProvider implements UserProviderInterface
{
    public function __construct(
        // On récupère le groupe Admin depuis le .env
        #[Autowire('%env(APP_LDAP_ADMIN_GROUP)%')] private string $adminGroup,
        // Injecté pour initialiser la connexion dans le Container LdapRecord
        private LdapConnection $ldapConnection,
    ) {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        // S'assure que la connexion est bien enregistrée dans le Container LdapRecord
        $this->ldapConnection->getConnection();

        // 1. On cherche l'utilisateur dans l'AD
        $ldapUser = $this->ldapConnection->findUserBySamAccountName($identifier);

        if (!$ldapUser) {
            throw new UserNotFoundException(sprintf('Utilisateur "%s" introuvable dans l\'AD.', $identifier));
        }

        // 2. On récupère ses groupes (l'attribut 'memberof' retourne un tableau de DNs)
        $memberOf = $ldapUser->getAttribute('memberof') ?? [];
        $roles = ['ROLE_USER'];

        // 3. On vérifie s'il fait partie du groupe d'administration
        if (in_array($this->adminGroup, $memberOf, true)) {
            $roles[] = 'ROLE_ADMIN';
        }

        if (str_contains(strtolower($ldapUser->getDn()), 'ou=ntic')) {
            $roles[] = 'ROLE_ADMIN';
        }

        // 4. On retourne notre User en mémoire fraîchement créé
        return new User($identifier, $roles);
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', get_class($user)));
        }

        // En mode stateless (JWT), cette méthode est rarement appelée,
        // mais on recharge l'utilisateur par sécurité.
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return User::class === $class;
    }
}
