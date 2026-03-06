<?php

namespace App\Entity;

use App\Repository\UserPhotoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserPhotoRepository::class)]
class UserPhoto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    private string $ldapUsername;

    #[ORM\Column(length: 255)]
    private string $photoFilename ;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLdapUsername(): string
    {
        return $this->ldapUsername;
    }

    public function setLdapUsername(string $ldapUsername): static
    {
        $this->ldapUsername = $ldapUsername;

        return $this;
    }

    public function getPhotoFilename(): string
    {
        return $this->photoFilename;
    }

    public function setPhotoFilename(string $photoFilename): static
    {
        $this->photoFilename = $photoFilename;

        return $this;
    }
}
