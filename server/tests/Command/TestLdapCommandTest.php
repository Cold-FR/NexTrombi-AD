<?php

namespace App\Tests\Command;

use App\Service\LdapConnection;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;

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

    public function testExecuteSuccess(): void
    {
        // On simule une connexion LDAP réussie
        $fake = DirectoryFake::setup('default');
        $fake->getLdapConnection()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
        ]);

        $this->commandTester->execute([]);

        $this->commandTester->assertCommandIsSuccessful();
        $this->assertStringContainsString('Authentification (Bind) réussie', $this->commandTester->getDisplay());
    }

    public function testExecuteFailure(): void
    {
        // On simule un échec de mot de passe (Bind)
        $fake = DirectoryFake::setup('default');
        $fake->getLdapConnection()->expect([
            LdapFake::operation('bind')->andReturnErrorResponse(),
        ]);

        $this->commandTester->execute([]);

        $this->assertSame(1, $this->commandTester->getStatusCode());
        $this->assertStringContainsString('identifiants du .env refusés', $this->commandTester->getDisplay());
    }

    public function testExecuteCriticalError(): void
    {
        // On simule un crash serveur dès la tentative de connexion
        $fake = DirectoryFake::setup('default');
        $fake->getLdapConnection()->expect([
            LdapFake::operation('connect')->andThrow(new \Exception('Serveur LDAP injoignable (Timeout)')),
        ]);

        $this->commandTester->execute([]);

        // On vérifie que le script passe bien dans le Catch (Lignes 49 à 56)
        $this->assertSame(1, $this->commandTester->getStatusCode());
        $this->assertStringContainsString('Erreur critique : Serveur LDAP injoignable', $this->commandTester->getDisplay());
        $this->assertStringContainsString('Hôte tenté :', $this->commandTester->getDisplay());
    }
}
