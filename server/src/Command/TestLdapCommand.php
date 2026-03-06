<?php

namespace App\Command;

use App\Service\LdapConnection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:test-ldap',
    description: 'Teste la connexion au serveur LDAP',
)]
class TestLdapCommand extends Command
{
    public function __construct(private readonly LdapConnection $ldapConnection)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Test de connexion LDAP');

        try {
            // Récupère la connexion initialisée par le service
            $connection = $this->ldapConnection->getConnection();

            // Tente de se connecter réellement
            $connection->connect();

            $io->success('Connexion TCP réussie au serveur !');

            // Tente de lire la racine (Bind)
            if ($connection->auth()->attempt(
                $connection->getConfiguration()->get('username'),
                $connection->getConfiguration()->get('password')
            )) {
                $io->success('Authentification (Bind) réussie avec le compte de service !');

                return Command::SUCCESS;
            }
            $io->error('Connexion OK, mais identifiants du .env refusés.');

            return Command::FAILURE;
        } catch (\Exception $e) {
            $io->error('Erreur critique : '.$e->getMessage());

            // Affiche les infos de debug
            $config = $this->ldapConnection->getConnection()->getConfiguration();
            $io->note(sprintf('Hôte tenté : %s Port : %s', implode(',', $config->get('hosts')), $config->get('port')));

            return Command::FAILURE;
        }
    }
}
