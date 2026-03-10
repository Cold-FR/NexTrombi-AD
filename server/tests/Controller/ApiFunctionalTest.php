<?php

namespace App\Tests\Controller;

use App\Security\User;
use App\Service\LdapConnection;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiFunctionalTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        // Boot le kernel une seule fois et force l'enregistrement de la connexion
        // 'default' dans le Container LdapRecord (requis avant DirectoryFake::setup())
        $this->client = static::createClient();
        $this->client->getContainer()->get(LdapConnection::class);
    }

    protected function tearDown(): void
    {
        DirectoryFake::tearDown();
        parent::tearDown();
    }

    public function testLoginWithEmptyBodyReturns401(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertSame('Identifiants manquants.', $data['error']);
    }

    public function testLoginWithEmptyCredentialsReturns401(): void
    {
        $this->client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], '{"username":"", "password":""}');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetUsersWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/users');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPostPhotoWithoutTokenReturns401(): void
    {
        $this->client->request('POST', '/api/users/1/photo');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPostPhotoWithoutFileReturns400(): void
    {
        // On simule un utilisateur connecté (rôle admin pour avoir le droit d'upload)
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        $this->client->request('POST', '/api/users/1/photo');

        $this->assertResponseStatusCodeSame(400);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Aucune image trouvée dans la requête.', $data['error']);
    }

    public function testLoginSuccessReturnsToken(): void
    {
        $fake = DirectoryFake::setup('default');

        $fake->getLdapConnection()->expect([
            // 1. L'Authenticator cherche l'utilisateur
            LdapFake::operation('search')->andReturn([
                [
                    'dn'             => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'objectclass'    => ['top', 'person', 'organizationalPerson', 'user'],
                ]
            ]),
            // 2. L'Authenticator vérifie le mot de passe
            LdapFake::operation('bind')
                ->with('cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local', 'bon_mot_de_passe')
                ->andReturnResponse(),
            // 3. Le UserProvider recharge l'utilisateur pour créer le Token
            LdapFake::operation('search')->andReturn([
                [
                    'dn'             => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'objectclass'    => ['top', 'person', 'organizationalPerson', 'user'],
                ]
            ]),
        ]);

        $this->client->request(
            'POST', '/api/login', [], [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'dupont.j', 'password' => 'bon_mot_de_passe'])
        );

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('user', $data);
        $this->assertSame('dupont.j', $data['user']);
    }

    public function testLoginFailureWithWrongPasswordReturns401(): void
    {
        $fake = DirectoryFake::setup('default');
        $fake->getLdapConnection()->expect([
            // 1. findByOrFail() cherche l'utilisateur
            LdapFake::operation('search')->andReturn([
                [
                    'dn'             => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                ]
            ]),
            // 2. auth()->attempt() retourne false → mauvais mot de passe
            LdapFake::operation('bind')
                ->with('cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local', 'mauvais_mdp')
                ->andReturnErrorResponse(),
        ]);

        $this->client->request(
            'POST', '/api/login', [], [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'dupont.j', 'password' => 'mauvais_mdp'])
        );

        $this->assertResponseStatusCodeSame(401);
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
    }
}
