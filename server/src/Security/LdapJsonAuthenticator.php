<?php

namespace App\Security;

use App\Service\LdapConnection;
use LdapRecord\Models\ActiveDirectory\User as LdapUser;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class LdapJsonAuthenticator extends AbstractAuthenticator
{
    public function __construct(
        private readonly LdapConnection $ldapConnection,
        private readonly JWTTokenManagerInterface $jwtManager,
    ) {
    }

    public function supports(Request $request): ?bool
    {
        // Ne s'active que si React fait un POST sur /api/login
        return '/api/login' === $request->getPathInfo() && $request->isMethod('POST');
    }

    public function authenticate(Request $request): Passport
    {
        // On lit le JSON envoyé par React
        $credentials = json_decode($request->getContent(), true);
        $username = $credentials['username'] ?? '';
        $password = $credentials['password'] ?? '';

        if (empty($username) || empty($password)) {
            throw new CustomUserMessageAuthenticationException('Identifiants manquants.');
        }

        $connection = $this->ldapConnection->getConnection();

        try {
            // On cherche l'utilisateur dans l'AD
            $ldapUser = LdapUser::findByOrFail('samaccountname', $username);

            // On tente la connexion avec son mot de passe
            if (!$connection->auth()->attempt($ldapUser->getDn(), $password)) {
                throw new CustomUserMessageAuthenticationException('Mot de passe incorrect.');
            }

            // Tout est bon, on passe l'identifiant au UserProvider
            return new SelfValidatingPassport(
                new UserBadge($username)
            );
        } catch (\Exception) {
            throw new CustomUserMessageAuthenticationException('Identifiants invalides ou compte introuvable.');
        }
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        // On génère un token JWT
        $user = $token->getUser();
        $jwt = $this->jwtManager->create($user);

        return new JsonResponse([
            'token' => $jwt,
            'user' => $user->getUserIdentifier(),
            'roles' => $user->getRoles(),
        ]);
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse([
            'error' => $exception->getMessageKey(),
        ], Response::HTTP_UNAUTHORIZED);
    }
}
