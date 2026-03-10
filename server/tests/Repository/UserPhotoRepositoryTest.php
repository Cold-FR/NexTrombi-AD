<?php

namespace App\Tests\Repository;

use App\Entity\UserPhoto;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class UserPhotoRepositoryTest extends KernelTestCase
{
    private ?EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        // On démarre le noyau Symfony pour avoir accès aux services
        $kernel = self::bootKernel();

        // On récupère l'EntityManager de Doctrine
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        // Bonne pratique : fermer l'EntityManager après chaque test pour éviter les fuites de mémoire
        $this->entityManager->close();
        $this->entityManager = null;
    }

    public function testFindOneByReturnsNullIfNonExistent(): void
    {
        $repository = $this->entityManager->getRepository(UserPhoto::class);
        $userPhoto = $repository->findOneBy(['ldapUsername' => 'ghost_user']);

        $this->assertNull($userPhoto);
    }

    public function testFindOneByReturnsEntityAfterPersist(): void
    {
        $userPhoto = new UserPhoto();
        $userPhoto->setLdapUsername('dupont.j');
        $userPhoto->setPhotoFilename('dupontj-123.webp');

        $this->entityManager->persist($userPhoto);
        $this->entityManager->flush();

        // On "vide" la mémoire de Doctrine pour le forcer à faire
        // une VRAIE requête SQL au lieu de nous renvoyer l'objet qu'il a gardé en cache
        $this->entityManager->clear();

        $repository = $this->entityManager->getRepository(UserPhoto::class);
        $savedPhoto = $repository->findOneBy(['ldapUsername' => 'dupont.j']);

        $this->assertNotNull($savedPhoto);
        $this->assertSame('dupont.j', $savedPhoto->getLdapUsername());
        $this->assertSame('dupontj-123.webp', $savedPhoto->getPhotoFilename());
        $this->assertNotNull($savedPhoto->getId()); // L'ID auto-incrémenté a bien été généré
    }

    public function testFindAllReturnsEmptyArrayOnEmptyDatabase(): void
    {
        $repository = $this->entityManager->getRepository(UserPhoto::class);
        $allPhotos = $repository->findAll();

        $this->assertEmpty($allPhotos);
    }

    public function testUniqueConstraintOnLdapUsernameThrowsException(): void
    {
        // Premier enregistrement valide
        $photo1 = new UserPhoto();
        $photo1->setLdapUsername('admin');
        $photo1->setPhotoFilename('admin1.webp');

        $this->entityManager->persist($photo1);
        $this->entityManager->flush();

        // Deuxième enregistrement avec le même ldapUsername
        $photo2 = new UserPhoto();
        $photo2->setLdapUsername('admin');
        $photo2->setPhotoFilename('admin2.webp');

        $this->entityManager->persist($photo2);

        // On informe PHPUnit qu'on s'attend à une exception SQL précise de contrainte unique
        $this->expectException(UniqueConstraintViolationException::class);

        $this->entityManager->flush();
    }
}
