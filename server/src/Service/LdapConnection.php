<?php

namespace App\Service;

use LdapRecord\Connection;
use LdapRecord\Container;
use LdapRecord\Models\ActiveDirectory\User as LdapUser;
use LdapRecord\Models\Model;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

readonly class LdapConnection
{
    public function __construct(
        #[Autowire('%env(LDAP_HOST)%')] private string            $host,
        #[Autowire('%env(LDAP_PORT)%')] private int               $port,
        #[Autowire('%env(LDAP_BASE_DN)%')] private string         $baseDn,
        #[Autowire('%env(LDAP_SEARCH_DN)%')] private string       $username,
        #[Autowire('%env(LDAP_SEARCH_PASSWORD)%')] private string $password,
        #[Autowire('%env(bool:LDAP_USE_TLS)%')] private bool      $useTls,
    ) {
        $this->connect();
    }

    private function connect(): void
    {
        $config = [
            'hosts' => [$this->host],
            'base_dn' => $this->baseDn,
            'username' => $this->username,
            'password' => $this->password,
            'port' => $this->port,
            'use_tls' => $this->useTls,
        ];

        Container::addConnection(new Connection($config), 'default');
    }

    public function getConnection(): Connection
    {
        return Container::getConnection('default');
    }

    /**
     * Encapsule l'appel statique LdapUser::findBy pour le rendre mockable dans les tests.
     */
    public function findUserBySamAccountName(string $username): Model|null
    {
        return LdapUser::findBy('samaccountname', $username);
    }
}
