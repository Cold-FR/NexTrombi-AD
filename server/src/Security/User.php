<?php

namespace App\Security;

use Symfony\Component\Security\Core\User\UserInterface;

readonly class User implements UserInterface
{
    /**
     * @param string[] $roles
     */
    public function __construct(
        private string $username,
        private array $roles = ['ROLE_USER'],
    ) {
    }

    public function getRoles(): array
    {
        return $this->roles;
    }

    public function eraseCredentials(): void
    {
        // Pas besoin de ça car on ne stocke pas de mot de passe
    }

    public function getUserIdentifier(): string
    {
        return $this->username;
    }
}
