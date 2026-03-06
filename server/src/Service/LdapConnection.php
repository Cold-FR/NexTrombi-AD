<?php

namespace App\Service;

use LdapRecord\Connection;
use LdapRecord\Container;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class LdapConnection
{
    // On stocke la connexion dans une propriété privée de la classe
    private ?Connection $connection = null;

    public function __construct(
        #[Autowire('%env(LDAP_HOST)%')] private readonly string $host,
        #[Autowire('%env(LDAP_PORT)%')] private readonly int $port,
        #[Autowire('%env(LDAP_BASE_DN)%')] private readonly string $baseDn,
        #[Autowire('%env(LDAP_SEARCH_DN)%')] private readonly string $username,
        #[Autowire('%env(LDAP_SEARCH_PASSWORD)%')] private readonly string $password,
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
            'use_tls' => false,
        ];

        $this->connection = new Connection($config);

        Container::addConnection($this->connection, 'default');
    }

    /**
     * Retourne l'objet connexion stocké localement.
     * Beaucoup plus fiable que de redemander au Container global.
     */
    public function getConnection(): Connection
    {
        if (!$this->connection) {
            $this->connect();
        }

        return $this->connection;
    }
}
