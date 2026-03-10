<?php

namespace App\Tests\Command;

use App\Service\LdapConnection;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

class TestLdapCommandTest extends KernelTestCase
{
    private CommandTester $commandTester;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();

        static::getContainer()->get(LdapConnection::class);

        $application = new Application($kernel);

        $command = $application->find('app:test-ldap');
        $this->commandTester = new CommandTester($command);
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
     * Configure le fake LDAP et retourne l'objet LdapFake pour enregistrer les expectations.
     */
    private function setupLdapFake(): LdapFake
    {
        /** @var LdapFake $ldapFake */
        $ldapFake = DirectoryFake::setup('default')->getLdapConnection();

        return $ldapFake;
    }

    public function testExecuteSuccess(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
        ]);

        $this->commandTester->execute([]);

        $this->commandTester->assertCommandIsSuccessful();
        $this->assertStringContainsString('Authentification (Bind) réussie', $this->commandTester->getDisplay());
    }

    public function testExecuteFailure(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnErrorResponse(),
        ]);

        $this->commandTester->execute([]);

        $this->assertSame(1, $this->commandTester->getStatusCode());
        $this->assertStringContainsString('identifiants du .env refusés', $this->commandTester->getDisplay());
    }

    public function testExecuteCriticalError(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('connect')->andThrow(new \Exception('Serveur LDAP injoignable (Timeout)')),
        ]);

        $this->commandTester->execute([]);

        $this->assertSame(1, $this->commandTester->getStatusCode());
        $this->assertStringContainsString('Erreur critique : Serveur LDAP injoignable', $this->commandTester->getDisplay());
        $this->assertStringContainsString('Hôte tenté :', $this->commandTester->getDisplay());
    }
}
