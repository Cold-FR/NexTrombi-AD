<?php

namespace App\Tests\Repository;

use App\Entity\UserIgnore;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class UserIgnoreRepositoryTest extends KernelTestCase
{
    private ?EntityManagerInterface $entityManager;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
        $this->entityManager = null;
    }

    public function testFindOneByReturnsNullIfNonExistent(): void
    {
        $repository = $this->entityManager->getRepository(UserIgnore::class);
        $result = $repository->findOneBy(['username' => 'ghost_user']);

        $this->assertNull($result);
    }

    public function testFindAllReturnsEmptyArrayOnEmptyDatabase(): void
    {
        $repository = $this->entityManager->getRepository(UserIgnore::class);

        $this->assertEmpty($repository->findAll());
    }

    public function testPersistAndFindOneBy(): void
    {
        $userIgnore = new UserIgnore();
        $userIgnore->setUsername('dupont.j');

        $this->entityManager->persist($userIgnore);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $repository = $this->entityManager->getRepository(UserIgnore::class);
        $found = $repository->findOneBy(['username' => 'dupont.j']);

        $this->assertNotNull($found);
        $this->assertSame('dupont.j', $found->getUsername());
        $this->assertNotNull($found->getId());
    }

    public function testRemoveDeletesEntity(): void
    {
        $userIgnore = new UserIgnore();
        $userIgnore->setUsername('martin.p');

        $this->entityManager->persist($userIgnore);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $repository = $this->entityManager->getRepository(UserIgnore::class);
        $found = $repository->findOneBy(['username' => 'martin.p']);
        $this->assertNotNull($found);

        $this->entityManager->remove($found);
        $this->entityManager->flush();
        $this->entityManager->clear();

        $this->assertNull($repository->findOneBy(['username' => 'martin.p']));
    }

    public function testUniqueConstraintOnLdapUsernameThrowsException(): void
    {
        $ignore1 = new UserIgnore();
        $ignore1->setUsername('doublon.user');
        $this->entityManager->persist($ignore1);
        $this->entityManager->flush();

        $ignore2 = new UserIgnore();
        $ignore2->setUsername('doublon.user');
        $this->entityManager->persist($ignore2);

        $this->expectException(UniqueConstraintViolationException::class);

        $this->entityManager->flush();
    }

    public function testFindAllReturnsMultipleEntries(): void
    {
        $repository = $this->entityManager->getRepository(UserIgnore::class);

        foreach (['user.a', 'user.b', 'user.c'] as $username) {
            $ignore = new UserIgnore();
            $ignore->setUsername($username);
            $this->entityManager->persist($ignore);
        }
        $this->entityManager->flush();
        $this->entityManager->clear();

        $all = $repository->findAll();
        $this->assertCount(3, $all);
    }
}
