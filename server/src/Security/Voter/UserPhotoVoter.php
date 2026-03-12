<?php

namespace App\Security\Voter;

use App\Entity\UserPhoto;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\AccessDecisionManagerInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * @extends Voter<string, UserPhoto>
 */
final class UserPhotoVoter extends Voter
{
    public const string UPLOAD = 'PHOTO_UPLOAD';
    public const string DELETE = 'PHOTO_DELETE';

    public function __construct(
        private readonly AccessDecisionManagerInterface $accessDecisionManager,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::UPLOAD, self::DELETE])
            && $subject instanceof UserPhoto;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        if (!$user instanceof UserInterface) {
            $vote?->addReason('L\'utilisateur doit être connecté pour gérer les photos.');

            return false;
        }

        if ($this->accessDecisionManager->decide($token, ['ROLE_ADMIN'])) {
            return true;
        }

        /**
         * @var UserPhoto $userPhoto
         */
        $userPhoto = $subject;

        return match ($attribute) {
            self::UPLOAD => $this->canUpload($userPhoto, $user),
            self::DELETE => $this->canDelete($userPhoto, $user),
            default => throw new \LogicException('This code should not be reached!'),
        };
    }

    private function canUpload(UserPhoto $userPhoto, UserInterface $user): bool
    {
        return $this->canDelete($userPhoto, $user);
    }

    private function canDelete(UserPhoto $userPhoto, UserInterface $user): bool
    {
        return $userPhoto->getLdapUsername() === $user->getUserIdentifier();
    }

    public function supportsAttribute(string $attribute): bool
    {
        return in_array($attribute, [self::UPLOAD, self::DELETE], true);
    }

    public function supportsType(string $subjectType): bool
    {
        return is_a($subjectType, UserPhoto::class, true);
    }
}
