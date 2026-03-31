<?php

namespace App\Tests\Entity;

use App\Entity\UserIgnore;
use PHPUnit\Framework\TestCase;

class UserIgnoreTest extends TestCase
{
    public function testGetIdIsNullBeforePersist(): void
    {
        $userIgnore = new UserIgnore();

        $this->assertNull($userIgnore->getId());
    }

    public function testLdapUsernameGetterAndSetter(): void
    {
        $userIgnore = new UserIgnore();

        $result = $userIgnore->setUsername('dupont.j');

        $this->assertSame($userIgnore, $result);
        $this->assertSame('dupont.j', $userIgnore->getUsername());
    }
}
