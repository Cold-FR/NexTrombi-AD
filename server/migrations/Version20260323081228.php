<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260323081228 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE UNIQUE INDEX uniq_userignore_username ON user_ignore (username)');
        $this->addSql('ALTER TABLE user_photo RENAME INDEX uniq_f6757f40e7ede989 TO uniq_userphoto_ldapUsername');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX uniq_userignore_username ON user_ignore');
        $this->addSql('ALTER TABLE user_photo RENAME INDEX uniq_userphoto_ldapUsername TO UNIQ_F6757F40E7EDE989');
    }
}
