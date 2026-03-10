<?php

namespace App\Tests\Security;

use App\Security\LdapJsonAuthenticator;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;

class LdapJsonAuthenticatorTest extends KernelTestCase
{
    private LdapJsonAuthenticator $authenticator;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->authenticator = static::getContainer()->get(LdapJsonAuthenticator::class);
    }

    public function testSupportsReturnsFalseOnWrongRoute(): void
    {
        $request = Request::create('/api/users', 'POST');
        $this->assertFalse($this->authenticator->supports($request));
    }

    public function testSupportsReturnsFalseOnGetMethod(): void
    {
        $request = Request::create('/api/login');
        $this->assertFalse($this->authenticator->supports($request));
    }

    public function testSupportsReturnsTrueOnValidRequest(): void
    {
        $request = Request::create('/api/login', 'POST');
        $this->assertTrue($this->authenticator->supports($request));
    }
}
