<?php

namespace App\Tests\Entity;

use App\Entity\UserPhoto;
use PHPUnit\Framework\TestCase;

class UserPhotoTest extends TestCase
{
    public function testLdapUsernameGetterAndSetter(): void
    {
        $userPhoto = new UserPhoto();

        $result = $userPhoto->setLdapUsername('dupont.j');

        $this->assertSame($userPhoto, $result);
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

        $this->assertNull($userPhoto->getId());
    }
}
