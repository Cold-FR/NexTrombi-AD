<?php

namespace App\Tests\Security;

use App\Security\LdapJitUserProvider;
use App\Security\User;
use App\Service\LdapConnection;
use LdapRecord\Models\ActiveDirectory\User as LdapUser;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\UserInterface;

// On utilise TestCase car on va mocker la seule dépendance (LdapConnection)
// et on n'a pas besoin de la base de données.
class LdapJitUserProviderTest extends TestCase
{
    private LdapConnection $ldapMock;
    private LdapJitUserProvider $provider;

    protected function setUp(): void
    {
        $this->ldapMock = $this->createStub(LdapConnection::class);
        $this->provider = new LdapJitUserProvider(
            adminGroup: 'CN=Admins,DC=test,DC=local',
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

        $ldapMock = $this->createMock(LdapConnection::class);
        $ldapMock->expects($this->once())
            ->method('findUserBySamAccountName')
            ->with('dupont.j')
            ->willReturn($ldapUser);

        $provider = new LdapJitUserProvider(
            adminGroup: 'CN=Admins,DC=test,DC=local',
            ldapConnection: $ldapMock,
        );

        $user = $provider->loadUserByIdentifier('dupont.j');

        $this->assertContains('ROLE_ADMIN', $user->getRoles());
    }
}
