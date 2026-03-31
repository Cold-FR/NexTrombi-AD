<?php

namespace App\Tests\Entity;

use App\Entity\CustomUser;
use PHPUnit\Framework\TestCase;

class CustomUserTest extends TestCase
{
    public function testGetIdIsNullBeforePersist(): void
    {
        $customUser = new CustomUser();

        $this->assertNull($customUser->getId());
    }

    public function testFirstnameGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setFirstName('Jean');

        $this->assertSame($customUser, $result);
        $this->assertSame('Jean', $customUser->getFirstName());
    }

    public function testLastnameGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setLastName('Dupont');

        $this->assertSame($customUser, $result);
        $this->assertSame('Dupont', $customUser->getLastName());
    }

    public function testJobTitleGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setJobTitle('Agent');

        $this->assertSame($customUser, $result);
        $this->assertSame('Agent', $customUser->getJobTitle());
    }

    public function testDepartmentGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setDepartment('Mairie');

        $this->assertSame($customUser, $result);
        $this->assertSame('Mairie', $customUser->getDepartment());
    }

    public function testEmailGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setEmail('dupont.j@example.com');

        $this->assertSame($customUser, $result);
        $this->assertSame('dupont.j@example.com', $customUser->getEmail());
    }

    public function testPhoneGetterAndSetter(): void
    {
        $customUser = new CustomUser();

        $result = $customUser->setPhone('0612345678');

        $this->assertSame($customUser, $result);
        $this->assertSame('0612345678', $customUser->getPhone());
    }
}
