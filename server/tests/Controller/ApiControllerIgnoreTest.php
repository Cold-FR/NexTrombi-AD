<?php

namespace App\Tests\Controller;

use App\Entity\UserIgnore;
use App\Security\User;
use App\Service\LdapConnection;
use Doctrine\ORM\EntityManagerInterface;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Tests couvrant les fonctionnalités de masquage/démasquage des utilisateurs
 * ainsi que le flag "hidden" dans la réponse GET /api/users.
 */
class ApiControllerIgnoreTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->client->getContainer()->get(LdapConnection::class);

        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        \assert($em instanceof EntityManagerInterface);
        $this->em = $em;
    }

    protected function tearDown(): void
    {
        try {
            DirectoryFake::tearDown();
        } catch (\Throwable) {
        }
        parent::tearDown();
    }

    private function setupLdapFake(): LdapFake
    {
        /** @var LdapFake $ldapFake */
        $ldapFake = DirectoryFake::setup('default')->getLdapConnection();

        return $ldapFake;
    }

    private function persistIgnore(): void
    {
        $ignore = new UserIgnore();
        $ignore->setUsername('dupont.j');
        $this->em->persist($ignore);
        $this->em->flush();
    }

    /**
     * Entrée LDAP minimale réutilisable.
     *
     * @return array<string, mixed>
     */
    private function makeLdapEntry(string $dn, string $samAccountName, string $givenName, string $sn): array
    {
        return [
            'dn' => $dn,
            'samaccountname' => [$samAccountName],
            'givenname' => [$givenName],
            'sn' => [$sn],
            'title' => ['Développeur'],
            'department' => ['Informatique'],
            'mail' => [$samAccountName.'@mairie.fr'],
            'telephonenumber' => ['0123456789'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultEntry(): array
    {
        return $this->makeLdapEntry(
            'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
            'dupont.j',
            'Jean',
            'Dupont'
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function martinEntry(): array
    {
        return $this->makeLdapEntry(
            'cn=Paul Martin,ou=utilisateurs,dc=mairie,dc=local',
            'martin.p',
            'Paul',
            'Martin'
        );
    }

    private function makeAdminClient(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        \assert($em instanceof EntityManagerInterface);
        $this->em = $em;
        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/users — comportement du flag hidden
    // ─────────────────────────────────────────────────────────────

    public function testHiddenUserIsInvisibleToRegularUser(): void
    {
        $this->persistIgnore();

        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([$this->defaultEntry()])
        );

        $this->client->loginUser(new User('martin.p', ['ROLE_USER']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(0, $data);
    }

    public function testHiddenUserIsVisibleToAdminWithHiddenFlagTrue(): void
    {
        $this->persistIgnore();

        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([$this->defaultEntry()])
        );

        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(1, $data);
        $this->assertSame('dupont.j', $data[0]['id']);
        $this->assertTrue($data[0]['hidden']);
    }

    public function testVisibleUserHasHiddenFalseForAdmin(): void
    {
        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([$this->defaultEntry()])
        );

        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(1, $data);
        $this->assertArrayHasKey('hidden', $data[0]);
        $this->assertFalse($data[0]['hidden']);
    }

    public function testHiddenFlagIsNotSentToRegularUser(): void
    {
        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([$this->defaultEntry()])
        );

        $this->client->loginUser(new User('dupont.j', ['ROLE_USER']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(1, $data);
        $this->assertArrayNotHasKey('hidden', $data[0]);
    }

    public function testMultipleUsersWithSomeHiddenFilteredForRegularUser(): void
    {
        $this->persistIgnore();

        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([
                $this->defaultEntry(),
                $this->martinEntry(),
            ])
        );

        $this->client->loginUser(new User('martin.p', ['ROLE_USER']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(1, $data);
        $this->assertSame('martin.p', $data[0]['id']);
    }

    public function testMultipleUsersAdminSeesAllWithCorrectFlags(): void
    {
        $this->persistIgnore();

        $this->setupLdapFake()->expect(
            LdapFake::operation('search')->andReturn([
                $this->defaultEntry(),
                $this->martinEntry(),
            ])
        );

        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(2, $data);

        $byId = array_column($data, null, 'id');
        $this->assertTrue($byId['dupont.j']['hidden']);
        $this->assertFalse($byId['martin.p']['hidden']);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/users/{ldapUsername}/ignore — toggle
    // ─────────────────────────────────────────────────────────────

    public function testToggleIgnoreHidesUser(): void
    {
        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('POST', '/api/users/dupont.j/ignore');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['hidden']);

        $this->em->clear();
        $found = $this->em->getRepository(UserIgnore::class)->findOneBy(['username' => 'dupont.j']);
        $this->assertNotNull($found);
    }

    public function testToggleIgnoreUnhidesAlreadyHiddenUser(): void
    {
        $this->persistIgnore();

        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('POST', '/api/users/dupont.j/ignore');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertFalse($data['hidden']);

        $this->em->clear();
        $found = $this->em->getRepository(UserIgnore::class)->findOneBy(['username' => 'dupont.j']);
        $this->assertNull($found);
    }

    public function testToggleIgnoreIsIdempotentOnThreeConsecutiveCalls(): void
    {
        $this->makeAdminClient();
        $this->client->request('POST', '/api/users/dupont.j/ignore');
        $this->assertResponseIsSuccessful();
        $this->assertTrue(json_decode($this->client->getResponse()->getContent(), true)['hidden']);

        $this->makeAdminClient();
        $this->client->request('POST', '/api/users/dupont.j/ignore');
        $this->assertResponseIsSuccessful();
        $this->assertFalse(json_decode($this->client->getResponse()->getContent(), true)['hidden']);

        $this->makeAdminClient();
        $this->client->request('POST', '/api/users/dupont.j/ignore');
        $this->assertResponseIsSuccessful();
        $this->assertTrue(json_decode($this->client->getResponse()->getContent(), true)['hidden']);
    }

    public function testToggleIgnoreReturns401ForUnauthenticated(): void
    {
        $this->client->request('POST', '/api/users/dupont.j/ignore');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testToggleIgnoreReturns403ForRegularUser(): void
    {
        $this->client->loginUser(new User('dupont.j', ['ROLE_USER']), 'api');
        $this->client->request('POST', '/api/users/dupont.j/ignore');

        $this->assertResponseStatusCodeSame(403);
    }

    public function testToggleIgnoreWorksWithUsernameContainingDots(): void
    {
        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('POST', '/api/users/jean.pierre.dupont/ignore');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertTrue($data['hidden']);

        $this->em->clear();
        $found = $this->em->getRepository(UserIgnore::class)->findOneBy(['username' => 'jean.pierre.dupont']);
        $this->assertNotNull($found);
    }

    public function testToggleIgnoreWorksWithUsernameContainingSpecialChars(): void
    {
        $this->client->loginUser(new User('admin', ['ROLE_ADMIN']), 'api');
        $this->client->request('POST', '/api/users/user_with-dash/ignore');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('hidden', $data);
        $this->assertTrue($data['hidden']);
    }
}
