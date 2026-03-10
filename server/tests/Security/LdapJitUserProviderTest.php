<?php

namespace App\Tests\Security;

use App\Security\LdapJitUserProvider;
use App\Security\User;
use App\Service\LdapConnection;
use LdapRecord\Models\ActiveDirectory\User as LdapUser;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;

// On utilise TestCase car on va mocker la seule dépendance (LdapConnection)
// et on n'a pas besoin de la base de données.
#[AllowMockObjectsWithoutExpectations]
class LdapJitUserProviderTest extends TestCase
{
    private LdapConnection $ldapMock;
    private LdapJitUserProvider $provider;

    protected function setUp(): void
    {
        $this->ldapMock = $this->createMock(LdapConnection::class);
        $this->provider = new LdapJitUserProvider(
            adminGroup: 'CN=Admins,DC=test,DC=local',
            adminOU: 'OU=ntic,DC=test,DC=local',
            ldapConnection: $this->ldapMock,
        );
    }

    public function testSupportsClass(): void
    {
        $this->assertTrue($this->provider->supportsClass(User::class));
        $this->assertFalse($this->provider->supportsClass(UserInterface::class));
    }

    public function testRefreshUserThrowsExceptionForUnsupportedClass(): void
    {
        $unsupportedUser = $this->createStub(UserInterface::class);

        $this->expectException(UnsupportedUserException::class);
        $this->provider->refreshUser($unsupportedUser);
    }

    public function testRoleAdminIsAssignedViaAdminGroup(): void
    {
        $ldapUser = $this->createMock(LdapUser::class);
        $ldapUser->expects($this->once())
            ->method('getAttribute')
            ->with('memberof')
            ->willReturn(['CN=Admins,DC=test,DC=local']);
        $ldapUser->method('getDn')->willReturn('cn=dupont.j,ou=users,dc=test,dc=local');

        $this->ldapMock->expects($this->once())
            ->method('findUserBySamAccountName')
            ->with('dupont.j')
            ->willReturn($ldapUser);

        $user = $this->provider->loadUserByIdentifier('dupont.j');

        $this->assertContains('ROLE_ADMIN', $user->getRoles());
    }

    public function testLoadUserByIdentifierThrowsExceptionWhenUserNotFound(): void
    {
        // On configure le mock pour qu'il ne trouve personne
        $this->ldapMock->method('findUserBySamAccountName')
            ->willReturn(null);

        $this->expectException(UserNotFoundException::class);
        $this->expectExceptionMessage('Utilisateur "inconnu" introuvable dans l\'AD.');

        $this->provider->loadUserByIdentifier('inconnu');
    }

    public function testRoleAdminIsAssignedViaNticOu(): void
    {
        $ldapUser = $this->createMock(LdapUser::class);
        $ldapUser->expects($this->once())
            ->method('getAttribute')
            // On simule un utilisateur hors du groupe Admin, mais dans l'OU ntic
            ->with('memberof')
            ->willReturn([]);
        $ldapUser->method('getDn')->willReturn('CN=Jean,OU=ntic,DC=test,DC=local');

        $this->ldapMock->expects($this->once())
            ->method('findUserBySamAccountName')
            ->with('jean.ntic')
            ->willReturn($ldapUser);

        $user = $this->provider->loadUserByIdentifier('jean.ntic');

        $this->assertContains('ROLE_ADMIN', $user->getRoles());
    }

    public function testRefreshUserReloadsUser(): void
    {
        $existingUser = new User('dupont.j', ['ROLE_USER']);

        $ldapUser = $this->createMock(LdapUser::class);
        $ldapUser->method('getDn')->willReturn('cn=dupont.j,ou=users,dc=test,dc=local');

        $this->ldapMock->expects($this->once())
            ->method('findUserBySamAccountName')
            ->with('dupont.j')
            ->willReturn($ldapUser);

        $refreshedUser = $this->provider->refreshUser($existingUser);

        $this->assertInstanceOf(User::class, $refreshedUser);
        $this->assertSame('dupont.j', $refreshedUser->getUserIdentifier());
    }
}
