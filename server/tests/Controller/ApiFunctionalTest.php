<?php

namespace App\Tests\Controller;

use App\Security\User;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ApiFunctionalTest extends WebTestCase
{
    public function testLoginWithEmptyBodyReturns401(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        $this->assertResponseStatusCodeSame(401);

        $responseContent = $client->getResponse()->getContent();
        $this->assertJson($responseContent);

        $data = json_decode($responseContent, true);
        $this->assertArrayHasKey('error', $data);
        $this->assertSame('Identifiants manquants.', $data['error']);
    }

    public function testLoginWithEmptyCredentialsReturns401(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/login', [], [], ['CONTENT_TYPE' => 'application/json'], '{"username":"", "password":""}');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testGetUsersWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/users');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPostPhotoWithoutTokenReturns401(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/users/1/photo');

        $this->assertResponseStatusCodeSame(401);
    }

    public function testPostPhotoWithoutFileReturns400(): void
    {
        $client = static::createClient();

        // On simule un utilisateur connecté (rôle admin pour avoir le droit d'upload)
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $client->loginUser($user, 'api');

        $client->request('POST', '/api/users/1/photo');

        $this->assertResponseStatusCodeSame(400);

        $responseContent = $client->getResponse()->getContent();
        $this->assertJson($responseContent);

        $data = json_decode($responseContent, true);
        $this->assertSame('Aucune image trouvée dans la requête.', $data['error']);
    }
}
