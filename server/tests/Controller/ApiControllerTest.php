<?php

namespace App\Tests\Controller;

use App\Entity\UserPhoto;
use App\Security\User;
use App\Service\LdapConnection;
use LdapRecord\LdapRecordException;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class ApiControllerTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        static::ensureKernelShutdown();
        $this->client = static::createClient();
        $this->client->getContainer()->get(LdapConnection::class);
    }

    protected function tearDown(): void
    {
        try {
            DirectoryFake::tearDown();
        } catch (\Throwable) {
            // Aucun fake actif
        }
        parent::tearDown();
    }

    public function testGetUsersReturns503OnLdapError(): void
    {
        // On simule une panne du serveur LDAP lors de la recherche
        DirectoryFake::setup('default')
            ->getLdapConnection()
            ->expect(
                LdapFake::operation('search')->andThrow(new LdapRecordException('Connexion LDAP impossible.'))
            );

        $user = new User('dupont.j', ['ROLE_USER']);
        $this->client->loginUser($user, 'api');

        $this->client->request('GET', '/api/users');

        $this->assertResponseStatusCodeSame(503);
        $this->assertStringContainsString('Erreur LDAP', $this->client->getResponse()->getContent());
    }

    public function testGetUsersReturnsSuccess(): void
    {
        $fake = DirectoryFake::setup('default');

        // On dit au faux LDAP : "Si on te fait une recherche (search), renvoie ça :"
        $fake->getLdapConnection()->expect([
            LdapFake::operation('search')->andReturn([
                [
                    'dn' => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'givenname' => ['Jean'],
                    'sn' => ['Dupont'],
                    'title' => ['Développeur'],
                    'department' => ['Informatique'],
                    'mail' => ['dupont.j@mairie.fr'],
                    'telephonenumber' => ['0123456789'],
                ]
            ])
        ]);

        $user = new User('dupont.j', ['ROLE_USER']);
        $this->client->loginUser($user, 'api');

        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();

        $data = json_decode($this->client->getResponse()->getContent(), true);

        $this->assertCount(1, $data);
        $this->assertSame('dupont.j', $data[0]['id']);
        $this->assertSame('Jean', $data[0]['firstName']);
        $this->assertSame('Dupont', $data[0]['lastName']);
        $this->assertSame('Développeur', $data[0]['jobTitle']);
    }

    public function testUploadPhotoSuccess(): void
    {
        $fake = DirectoryFake::setup('default');

        $fake->getLdapConnection()->expect([
            // 1. L'API va d'abord chercher l'utilisateur pour vérifier qu'il existe
            LdapFake::operation('search')->andReturn([
                [
                    'dn' => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'objectclass' => ['top', 'person', 'organizationalPerson', 'user'],
                ]
            ]),
            // 2. L'API va ensuite écraser sa photo (modification en lot)
            LdapFake::operation('modifyBatch')->andReturn(true)
        ]);

        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        $tempFile = sys_get_temp_dir() . '/test_photo_api.jpg';
        $image = imagecreatetruecolor(10, 10);
        imagejpeg($image, $tempFile);

        $uploadedFile = new UploadedFile($tempFile, 'photo.jpg', 'image/jpeg', null, true);

        $this->client->request('POST', '/api/users/1/photo', [], ['photo' => $uploadedFile]);

        $this->assertResponseIsSuccessful();

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Photo mise à jour avec succès', $data['message']);

        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
    }

    public function testGetUsersWithLocalPhoto(): void
    {
        $fake = DirectoryFake::setup('default');
        $fake->getLdapConnection()->expect([
            LdapFake::operation('search')->andReturn([
                [
                    'dn' => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'givenname' => ['Jean'],
                    'sn' => ['Dupont'],
                ]
            ])
        ]);

        // On injecte manuellement une photo dans la BDD de test SQLite
        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        $userPhoto = new UserPhoto();
        $userPhoto->setLdapUsername('dupont.j');
        $userPhoto->setPhotoFilename('photo_existante.webp');

        $em->persist($userPhoto);
        $em->flush();

        $user = new User('dupont.j', ['ROLE_USER']);
        $this->client->loginUser($user, 'api');

        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);

        // On vérifie que la photo locale a bien été ajoutée à l'URL renvoyée par l'API
        $this->assertStringContainsString('photo_existante.webp', $data[0]['photoUrl']);
    }

    public function testUploadPhotoReplacesOldLocalPhoto(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);

        $this->client->loginUser($user, 'api');

        $tempFile1 = sys_get_temp_dir() . '/photo1.jpg';
        imagejpeg(imagecreatetruecolor(10, 10), $tempFile1);
        $uploadedFile1 = new UploadedFile($tempFile1, 'photo1.jpg', 'image/jpeg', null, true);

        $this->client->request('POST', '/api/users/1/photo', [], ['photo' => $uploadedFile1]);

        $this->assertResponseIsSuccessful();
        $data1 = json_decode($this->client->getResponse()->getContent(), true);

        // On récupère le chemin de l'image générée
        $oldFilename = basename($data1['photoUrl']);
        $projectDir = $this->client->getContainer()->getParameter('kernel.project_dir');
        $oldFilePath = $projectDir . '/public/uploads/photos/' . $oldFilename;

        $this->assertFileExists($oldFilePath);

        static::ensureKernelShutdown();

        $client2 = static::createClient();
        $client2->getContainer()->get(LdapConnection::class); // On mime le setUp()
        $client2->loginUser($user, 'api');

        $tempFile2 = sys_get_temp_dir() . '/photo2.jpg';
        imagejpeg(imagecreatetruecolor(10, 10), $tempFile2);
        $uploadedFile2 = new UploadedFile($tempFile2, 'photo2.jpg', 'image/jpeg', null, true);

        $client2->request('POST', '/api/users/1/photo', [], ['photo' => $uploadedFile2]);

        $this->assertResponseIsSuccessful();

        // On vide le cache système de PHP pour être sûr de bien lire le disque dur
        clearstatcache();

        // Le contrôleur a dû détecter et supprimer l'ancien fichier
        $this->assertFileDoesNotExist($oldFilePath);

        // Nettoyage de nos faux fichiers temporaires
        if (file_exists($tempFile1)) unlink($tempFile1);
        if (file_exists($tempFile2)) unlink($tempFile2);
    }

    public function testUploadPhotoReturns500OnException(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        // On envoie un fichier texte déguisé en image.
        $tempFile = sys_get_temp_dir() . '/invalid.txt';
        file_put_contents($tempFile, 'Not an image');
        $uploadedFile = new UploadedFile($tempFile, 'invalid.txt', 'text/plain', null, true);

        $this->client->request('POST', '/api/users/1/photo', [], ['photo' => $uploadedFile]);

        $this->assertResponseStatusCodeSame(500);

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);

        unlink($tempFile);
    }
}
