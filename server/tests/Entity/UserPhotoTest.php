<?php

namespace App\Tests\Entity;

use App\Entity\UserPhoto;
use PHPUnit\Framework\TestCase;

class UserPhotoTest extends TestCase
{
    public function testLdapUsernameGetterAndSetter(): void
    {
        $userPhoto = new UserPhoto();

        // On vérifie que le setter retourne bien l'instance elle-même (fluent interface)
        $result = $userPhoto->setLdapUsername('dupont.j');
        $this->assertSame($userPhoto, $result);

        // On vérifie que la donnée a bien été assignée
        $this->assertSame('dupont.j', $userPhoto->getLdapUsername());
    }

    public function testPhotoFilenameGetterAndSetter(): void
    {
        $userPhoto = new UserPhoto();

        $result = $userPhoto->setPhotoFilename('dupontj-123.webp');

        $this->assertSame($userPhoto, $result);
        $this->assertSame('dupontj-123.webp', $userPhoto->getPhotoFilename());
    }

    public function testGetIdIsNullBeforePersist(): void
    {
        $userPhoto = new UserPhoto();

        // L'ID ne doit pas être défini à l'instanciation (il l'est par Doctrine après le flush)
        $this->assertNull($userPhoto->getId());
    }
}
