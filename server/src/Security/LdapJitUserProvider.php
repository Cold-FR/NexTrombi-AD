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
        #[Autowire('%env(APP_LDAP_ADMIN_GROUP)%')] private string $adminGroup,
        #[Autowire('%env(APP_LDAP_ADMIN_OU)%')] private string $adminOU,
        private LdapConnection $ldapConnection,
    ) {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $ldapUser = $this->ldapConnection->findUserBySamAccountName($identifier);

        if (!$ldapUser) {
            throw new UserNotFoundException(sprintf('Utilisateur "%s" introuvable dans l\'AD.', $identifier));
        }

        $memberOf = $ldapUser->getAttribute('memberof') ?? [];
        $memberOf = is_array($memberOf) ? $memberOf : [$memberOf];
        $roles = ['ROLE_USER'];

        $isAdmin = in_array($this->adminGroup, $memberOf, true)
            || $this->isInAdminOu($ldapUser->getDn());

        if ($isAdmin) {
            $roles[] = 'ROLE_ADMIN';
        }

        return new User($identifier, $roles);
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Les instances de "%s" ne sont pas supportées.', get_class($user)));
        }

        // En mode stateless JWT, on reconstruit depuis les données du token
        // sans aller interroger le LDAP inutilement
        return $user;
    }

    public function supportsClass(string $class): bool
    {
        return User::class === $class;
    }

    private function isInAdminOu(string $dn): bool
    {
        $components = array_map(
            static fn (string $part) => strtolower(trim($part)),
            explode(',', $dn)
        );

        return in_array(strtolower(trim($this->adminOU)), $components, true);
    }
}
