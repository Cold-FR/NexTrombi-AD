<?php

namespace App\Tests\Security;

use App\Security\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testGetUserIdentifierReturnsUsername(): void
    {
        $user = new User('dupont.j');

        $this->assertSame('dupont.j', $user->getUserIdentifier());
    }

    public function testGetRolesReturnsDefaultRole(): void
    {
        $user = new User('dupont.j');

        // Par défaut, le constructeur doit assigner ['ROLE_USER']
        $this->assertSame(['ROLE_USER'], $user->getRoles());
    }

    public function testGetRolesReturnsProvidedRoles(): void
    {
        $roles = ['ROLE_USER', 'ROLE_ADMIN'];
        $user = new User('admin_user', $roles);

        $this->assertSame($roles, $user->getRoles());
    }

    public function testEraseCredentialsIsNoOp(): void
    {
        $user = new User('dupont.j');

        // On indique à PHPUnit que ce test est censé réussir même s'il n'y a pas
        // de "assert" explicite, car on veut juste vérifier qu'aucune erreur ne plante le script.
        $this->expectNotToPerformAssertions();

        $user->eraseCredentials();
    }
}
