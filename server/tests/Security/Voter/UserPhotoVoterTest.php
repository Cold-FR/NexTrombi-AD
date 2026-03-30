<?php

namespace App\Tests\Security\Voter;

use App\Security\Voter\UserPhotoVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManagerInterface;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class UserPhotoVoterTest extends TestCase
{
    private function createVoter(bool $isAdmin): UserPhotoVoter
    {
        $adm = $this->createStub(AccessDecisionManagerInterface::class);
        $adm->method('decide')->willReturn($isAdmin);

        return new UserPhotoVoter($adm);
    }

    public function testVoteWithoutUser(): void
    {
        $voter = $this->createVoter(false);
        $token = $this->createStub(TokenInterface::class);
        $token->method('getUser')->willReturn(null);

        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::DELETE]));
        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::UPLOAD]));
    }

    public function testVoteAsAdmin(): void
    {
        $voter = $this->createVoter(true);
        $token = $this->createStub(TokenInterface::class);
        $user = $this->createStub(UserInterface::class);
        $token->method('getUser')->willReturn($user);

        $this->assertSame(VoterInterface::ACCESS_GRANTED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::DELETE]));
        $this->assertSame(VoterInterface::ACCESS_GRANTED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::UPLOAD]));
    }

    public function testVoteAsOwner(): void
    {
        $voter = $this->createVoter(false);
        $token = $this->createStub(TokenInterface::class);
        $user = $this->createStub(UserInterface::class);

        $user->method('getUserIdentifier')->willReturn('dupont.j');
        $token->method('getUser')->willReturn($user);

        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::UPLOAD]));
        $this->assertSame(VoterInterface::ACCESS_GRANTED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::DELETE]));
    }

    public function testVoteAsOtherUser(): void
    {
        $voter = $this->createVoter(false);
        $token = $this->createStub(TokenInterface::class);
        $user = $this->createStub(UserInterface::class);

        $user->method('getUserIdentifier')->willReturn('martin.p');
        $token->method('getUser')->willReturn($user);

        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::UPLOAD]));
        $this->assertSame(VoterInterface::ACCESS_DENIED, $voter->vote($token, 'dupont.j', [UserPhotoVoter::DELETE]));
    }
}
