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

    /**
     * Retourne un tableau représentant une entrée LDAP avec des valeurs par défaut
     * surchargeables, pour éviter la duplication dans chaque test.
     *
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private function makeLdapEntry(array $overrides = []): array
    {
        return array_merge([
            'dn' => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
            'samaccountname' => ['dupont.j'],
            'givenname' => ['Jean'],
            'sn' => ['Dupont'],
            'title' => ['Développeur'],
            'department' => ['Informatique'],
            'mail' => ['dupont.j@mairie.fr'],
            'telephonenumber' => ['0123456789'],
        ], $overrides);
    }

    /**
     * Crée un fichier JPEG temporaire valide et retourne son chemin.
     * Penser à unlink() après usage.
     */
    private function createTempJpeg(string $name = 'test.jpg'): string
    {
        $path = sys_get_temp_dir().'/'.$name;
        imagejpeg(imagecreatetruecolor(10, 10), $path);

        return $path;
    }

    /**
     * Reboot le kernel en mode 'ad' et réenregistre LdapConnection.
     * Doit être appelé en premier dans le test, avant toute requête.
     */
    private function switchToAdMode(): KernelBrowser
    {
        putenv('APP_PHOTO_STORAGE_MODE=ad');
        $_ENV['APP_PHOTO_STORAGE_MODE'] = 'ad';
        $_SERVER['APP_PHOTO_STORAGE_MODE'] = 'ad';
        static::ensureKernelShutdown();
        $client = static::createClient();
        $client->getContainer()->get(LdapConnection::class);

        return $client;
    }

    /**
     * Remet APP_PHOTO_STORAGE_MODE à 'local' après un test en mode AD.
     */
    private function resetAdMode(): void
    {
        putenv('APP_PHOTO_STORAGE_MODE=local');
        $_ENV['APP_PHOTO_STORAGE_MODE'] = 'local';
        unset($_SERVER['APP_PHOTO_STORAGE_MODE']);
    }

    /**
     * Configure le fake LDAP et retourne l'objet LdapFake pour enregistrer les expectations.
     */
    private function setupLdapFake(): LdapFake
    {
        /** @var LdapFake $ldapFake */
        $ldapFake = DirectoryFake::setup('default')->getLdapConnection();

        return $ldapFake;
    }

    public function testGetUsersReturns503OnLdapError(): void
    {
        $this->setupLdapFake()
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
        $this->setupLdapFake()
            ->expect(LdapFake::operation('search')->andReturn([$this->makeLdapEntry()]));

        $this->client->loginUser(new User('dupont.j', ['ROLE_USER']), 'api');
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
        $this->setupLdapFake()
            ->expect([
                LdapFake::operation('search')->andReturn([
                    $this->makeLdapEntry(['objectclass' => ['top', 'person', 'organizationalPerson', 'user']]),
                ]),
                LdapFake::operation('modifyBatch')->andReturn(true),
            ]);

        $this->client->loginUser(new User('admin_user', ['ROLE_ADMIN']), 'api');

        $tempFile = $this->createTempJpeg('test_photo_api.jpg');
        $this->client->request('POST', '/api/users/admin_user/photo', [], [
            'photo' => new UploadedFile($tempFile, 'photo.jpg', 'image/jpeg', null, true),
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertSame('Photo mise à jour avec succès', json_decode($this->client->getResponse()->getContent(), true)['message']);

        unlink($tempFile);
    }

    public function testGetUsersWithLocalPhoto(): void
    {
        $this->setupLdapFake()
            ->expect(LdapFake::operation('search')->andReturn([
                $this->makeLdapEntry(['title' => null, 'department' => null, 'mail' => null, 'telephonenumber' => null]),
            ]));

        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        $em->persist(new UserPhoto()->setLdapUsername('dupont.j')->setPhotoFilename('photo_existante.webp'));
        $em->flush();

        $this->client->loginUser(new User('dupont.j', ['ROLE_USER']), 'api');
        $this->client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $this->assertStringContainsString('photo_existante.webp', json_decode($this->client->getResponse()->getContent(), true)[0]['photoUrl']);
    }

    public function testGetUsersInAdMode(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()
            ->expect(LdapFake::operation('search')->andReturn([
                $this->makeLdapEntry([
                    'thumbnailphoto' => [base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')],
                ]),
            ]));

        $client->loginUser(new User('dupont.j', ['ROLE_USER']), 'api');
        $client->request('GET', '/api/users');

        $this->assertResponseIsSuccessful();
        $this->assertStringStartsWith(
            'data:image/jpeg;base64,',
            json_decode($client->getResponse()->getContent(), true)[0]['photoUrl']
        );

        $this->resetAdMode();
    }

    public function testUploadPhotoSuccessInAdMode(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()
            ->expect([
                LdapFake::operation('search')->andReturn([
                    $this->makeLdapEntry(['objectclass' => ['top', 'person', 'organizationalPerson', 'user']]),
                ]),
                LdapFake::operation('modifyBatch')->andReturn(true),
            ]);

        $client->loginUser(new User('admin_user', ['ROLE_ADMIN']), 'api');

        $tempFile = $this->createTempJpeg('test_ad.jpg');
        $client->request('POST', '/api/users/dupont.j/photo', [], [
            'photo' => new UploadedFile($tempFile, 'test.jpg', 'image/jpeg', null, true),
        ]);

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);

        // Vérifie le message de succès (ligne 159) et l'URL Base64 (ligne 131)
        $this->assertSame('Photo mise à jour avec succès', $data['message']);
        $this->assertStringStartsWith('data:image/jpeg;base64,', $data['photoUrl']);

        unlink($tempFile);
        $this->resetAdMode();
    }

    public function testUploadPhotoReturns404IfUserNotFoundInAdMode(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()
            ->expect(LdapFake::operation('search')->andReturn([]));

        $client->loginUser(new User('admin_user', ['ROLE_ADMIN']), 'api');

        $tempFile = $this->createTempJpeg('test_404.jpg');
        $client->request('POST', '/api/users/inconnu/photo', [], [
            'photo' => new UploadedFile($tempFile, 'test.jpg', 'image/jpeg', null, true),
        ]);

        $this->assertResponseStatusCodeSame(404);
        $this->assertSame(
            'Utilisateur introuvable dans l\'AD.',
            json_decode($client->getResponse()->getContent(), true)['error']
        );

        unlink($tempFile);
        $this->resetAdMode();
    }

    public function testDeletePhotoSuccessInLocalModeWithExistingPhoto(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        // On injecte manuellement une photo dans la BDD
        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        $userPhoto = new UserPhoto();
        $userPhoto->setLdapUsername('dupont.j');
        $userPhoto->setPhotoFilename('photo_a_supprimer.webp');
        $em->persist($userPhoto);
        $em->flush();

        // On crée un faux fichier physique sur le disque
        $projectDir = $this->client->getContainer()->getParameter('kernel.project_dir');
        $uploadsDir = $projectDir.'/public/uploads/photos';
        @mkdir($uploadsDir, 0777, true);
        $filePath = $uploadsDir.'/photo_a_supprimer.webp';
        file_put_contents($filePath, 'fake image data');

        // On lance la requête de suppression
        $this->client->request('DELETE', '/api/users/dupont.j/photo');

        // On vérifie le succès
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Photo supprimée avec succès', $data['message']);

        // On vérifie que le fichier a bien été supprimé du disque
        $this->assertFileDoesNotExist($filePath);

        // On vérifie que l'entité a bien été supprimée de la BDD
        $deletedPhoto = $em->getRepository(UserPhoto::class)->findOneBy(['ldapUsername' => 'dupont.j']);
        $this->assertNull($deletedPhoto);
    }

    public function testDeletePhotoSuccessInLocalModeWithoutExistingPhoto(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        // On supprime la photo d'un utilisateur qui n'en a pas
        $this->client->request('DELETE', '/api/users/inconnu/photo');

        // La route doit retourner un succès quand même (idempotence)
        $this->assertResponseIsSuccessful();
        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame('Photo supprimée avec succès', $data['message']);
    }

    public function testDeletePhotoSuccessInAdMode(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()->expect([
            // L'utilisateur existe
            LdapFake::operation('search')->andReturn([
                [
                    'dn' => 'cn=Jean Dupont,ou=utilisateurs,dc=mairie,dc=local',
                    'samaccountname' => ['dupont.j'],
                    'thumbnailphoto' => ['binaire_a_supprimer'],
                ],
            ]),
            // L'API va écraser sa photo (thumbnailphoto = null)
            LdapFake::operation('modifyBatch')->andReturn(true),
        ]);

        $user = new User('admin_user', ['ROLE_ADMIN']);
        $client->loginUser($user, 'api');

        $client->request('DELETE', '/api/users/dupont.j/photo');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Photo supprimée avec succès', $data['message']);

        $this->resetAdMode();
    }

    public function testDeletePhotoReturns404IfUserNotFoundInAdMode(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()->expect([
            LdapFake::operation('search')->andReturn([]), // Aucun résultat
        ]);

        $user = new User('admin_user', ['ROLE_ADMIN']);
        $client->loginUser($user, 'api');

        $client->request('DELETE', '/api/users/inconnu/photo');

        $this->assertResponseStatusCodeSame(404);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Utilisateur introuvable dans l\'AD.', $data['error']);

        $this->resetAdMode();
    }

    public function testDeletePhotoReturns500OnException(): void
    {
        $client = $this->switchToAdMode();

        $this->setupLdapFake()->expect([
            LdapFake::operation('search')->andThrow(new \Exception('Erreur interne LDAP')),
        ]);

        $user = new User('admin_user', ['ROLE_ADMIN']);
        $client->loginUser($user, 'api');

        $client->request('DELETE', '/api/users/dupont.j/photo');

        $this->assertResponseStatusCodeSame(500);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('Erreur interne LDAP', $data['error']);

        $this->resetAdMode();
    }

    public function testUploadPhotoReplacesOldLocalPhotoFile(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        $em = $this->client->getContainer()->get('doctrine.orm.entity_manager');
        $userPhoto = new UserPhoto();
        $userPhoto->setLdapUsername('dupont.j');
        $userPhoto->setPhotoFilename('old_photo.webp');
        $em->persist($userPhoto);
        $em->flush();

        $projectDir = $this->client->getContainer()->getParameter('kernel.project_dir');
        $uploadsDir = $projectDir.'/public/uploads/photos';
        @mkdir($uploadsDir, 0777, true);
        $oldFilePath = $uploadsDir.'/old_photo.webp';
        file_put_contents($oldFilePath, 'old content');

        $tempFile = sys_get_temp_dir().'/new_photo.jpg';
        imagejpeg(imagecreatetruecolor(10, 10), $tempFile);
        $uploadedFile = new UploadedFile($tempFile, 'photo.jpg', 'image/jpeg', null, true);

        $this->client->request('POST', '/api/users/dupont.j/photo', [], ['photo' => $uploadedFile]);

        $this->assertResponseIsSuccessful();
        $this->assertFileDoesNotExist($oldFilePath);

        unlink($tempFile);
    }

    public function testUploadPhotoReturns500OnException(): void
    {
        $user = new User('admin_user', ['ROLE_ADMIN']);
        $this->client->loginUser($user, 'api');

        // On envoie un fichier texte pour forcer une erreur dans le UploadService
        $tempFile = sys_get_temp_dir().'/invalid.txt';
        file_put_contents($tempFile, 'Ceci n\'est pas une image');

        $uploadedFile = new UploadedFile(
            $tempFile,
            'invalid.txt',
            'text/plain',
            null,
            true
        );

        $this->client->request('POST', '/api/users/dupont.j/photo', [], ['photo' => $uploadedFile]);

        $this->assertResponseStatusCodeSame(500);

        $data = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertStringContainsString('Format d\'image non supporté', $data['error']);

        unlink($tempFile);
    }
}
