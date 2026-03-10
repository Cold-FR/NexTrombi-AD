<?php

namespace App\Command;

use App\Service\LdapConnection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:ldap-structure',
    description: 'Affiche la structure (OUs et Conteneurs) de l\'Active Directory',
)]
class ShowLdapStructureCommand extends Command
{
    public function __construct(private readonly LdapConnection $ldapConnection)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Structure de l\'Active Directory');

        try {
            $connection = $this->ldapConnection->getConnection();
            $connection->connect();

            // Vérification de l'authentification
            if (!$connection->auth()->attempt(
                $connection->getConfiguration()->get('username'),
                $connection->getConfiguration()->get('password')
            )) {
                $io->error('Authentification refusée par le serveur AD.');

                return Command::FAILURE;
            }

            $io->info('Recherche des Unités Organisationnelles (OU) et Conteneurs en cours...');

            // Requête LDAP : On cherche les OUs et les Conteneurs
            $results = $connection->query()
                ->rawFilter('(|(objectclass=organizationalUnit)(objectclass=container))')
                ->select(['ou', 'cn', 'dn'])
                ->get();

            if (0 === count($results)) {
                $io->warning('Aucune structure n\'a été trouvée.');

                return Command::SUCCESS;
            }

            $rows = [];
            foreach ($results as $item) {
                if (is_object($item) && method_exists($item, 'getDn')) {
                    // Si la librairie renvoie des Objets Modèles (ex: LdapRecord)
                    $dn = $item->getDn();
                    $name = $item->getFirstAttribute('ou') ?? $item->getFirstAttribute('cn') ?? 'Inconnu';
                } else {
                    // Si la librairie renvoie des tableaux bruts
                    $dn = is_string($item['dn']) ? $item['dn'] : ($item['dn'][0] ?? 'Inconnu');
                    $name = $item['ou'][0] ?? $item['cn'][0] ?? 'Inconnu';
                }

                // Astuce visuelle : on calcule la profondeur dans l'arbre
                $depth = substr_count($dn, ',');
                $indent = str_repeat('   ', max(0, $depth - 2));

                $rows[] = [
                    $indent.'└─ '.$name,
                    $dn,
                ];
            }

            // Tri par DN
            usort($rows, function ($a, $b) {
                $dnA = implode(',', array_reverse(explode(',', $a[1])));
                $dnB = implode(',', array_reverse(explode(',', $b[1])));

                return strcmp($dnA, $dnB);
            });

            // Affichage dans un tableau Symfony
            $table = new Table($output);
            $table
                ->setHeaders(['Nom (Hierarchie relative)', 'Distinguished Name (DN) complet'])
                ->setRows($rows)
                ->render();

            $io->success(sprintf('Terminé ! %d éléments structurels trouvés.', count($results)));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur lors de la lecture de l\'AD : '.$e->getMessage());

            return Command::FAILURE;
        }
    }
}
