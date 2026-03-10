<?php

namespace App\Tests\Command;

use App\Service\LdapConnection;
use LdapRecord\Testing\DirectoryFake;
use LdapRecord\Testing\LdapFake;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

class ShowLdapStructureCommandTest extends KernelTestCase
{
    private CommandTester $commandTester;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();

        static::getContainer()->get(LdapConnection::class);

        $application = new Application($kernel);

        $command = $application->find('app:ldap-structure');
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

    public function testExecuteAuthenticationFailure(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnErrorResponse(),
        ]);

        $this->commandTester->execute([]);

        $this->assertStringContainsString('Authentification refusée', $this->commandTester->getDisplay());
        $this->assertSame(1, $this->commandTester->getStatusCode());
    }

    public function testExecuteNoResults(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
            LdapFake::operation('search')->andReturn([]),
        ]);

        $this->commandTester->execute([]);

        $this->assertStringContainsString('Aucune structure n\'a été trouvée', $this->commandTester->getDisplay());
        $this->assertSame(0, $this->commandTester->getStatusCode());
    }

    public function testExecuteSuccessWithHierarchy(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
            LdapFake::operation('search')->andReturn([
                [
                    'dn' => 'dc=mairie,dc=local',
                    'ou' => ['Mairie'],
                ],
                [
                    'dn' => 'ou=utilisateurs,ou=services,dc=mairie,dc=local',
                    'ou' => ['Utilisateurs'],
                ],
                [
                    'dn' => 'cn=Config,dc=mairie,dc=local',
                    'cn' => ['Config'],
                ],
            ]),
        ]);

        $this->commandTester->execute([]);

        $output = $this->commandTester->getDisplay();

        $this->assertStringContainsString('Distinguished Name (DN) complet', $output);
        $this->assertStringContainsString('└─ Mairie', $output);
        $this->assertStringContainsString('   └─ Utilisateurs', $output);

        $this->assertSame(0, $this->commandTester->getStatusCode());
    }

    public function testExecuteCriticalError(): void
    {
        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
            LdapFake::operation('search')->andThrow(new \Exception('Serveur débranché')),
        ]);

        $this->commandTester->execute([]);

        $this->assertStringContainsString('Erreur lors de la lecture de l\'AD', $this->commandTester->getDisplay());
        $this->assertSame(1, $this->commandTester->getStatusCode());
    }

    public function testExecuteSuccessWithObjectHierarchy(): void
    {
        // On simule un résultat sous forme d'Objet (comme le fait l'ORM LdapRecord)
        $mockObject = new class {
            public function getDn(): string
            {
                return 'ou=objets,dc=mairie,dc=local';
            }

            public function getFirstAttribute(string $attr): ?string
            {
                return 'ou' === $attr ? 'Objets' : null;
            }
        };

        $this->setupLdapFake()->expect([
            LdapFake::operation('bind')->andReturnResponse(),
            LdapFake::operation('search')->andReturn([$mockObject]),
        ]);

        $this->commandTester->execute([]);

        $this->assertStringContainsString('└─ Objets', $this->commandTester->getDisplay());
        $this->assertSame(0, $this->commandTester->getStatusCode());
    }
}
