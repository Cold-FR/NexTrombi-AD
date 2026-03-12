# 📇 NexTrombi-AD

> Annuaire visuel des collaborateurs connecté à votre Active Directory.  
> Authentification LDAP, gestion des photos (stockage local ou directement dans l'AD), rôles basés sur les groupes AD, interface moderne et responsive.

![Symfony](https://img.shields.io/badge/Symfony-8.0-purple?logo=symfony)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![PHP](https://img.shields.io/badge/PHP-≥8.5-777BB4?logo=php)
![License](https://img.shields.io/badge/License-MIT-green)

<p align="center">
  <img src="https://i.imgur.com/MjiFiKr.png" alt="Capture d'écran" width="1280"/>
</p>

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
  - [1. Cloner le dépôt](#1-cloner-le-dépôt)
  - [2. Backend (Symfony)](#2-backend-symfony)
  - [3. Frontend (React)](#3-frontend-react)
- [Configuration](#-configuration)
  - [Variables d'environnement — Backend](#variables-denvironnement--backend)
  - [Variables d'environnement — Frontend](#variables-denvironnement--frontend)
  - [Mode de stockage des photos](#mode-de-stockage-des-photos)
  - [Clés JWT](#clés-jwt)
- [Utilisation](#-utilisation)
- [Docker (développement)](#-docker-développement)
- [Commandes utiles](#-commandes-utiles)
- [API Endpoints](#-api-endpoints)
- [Qualité de code](#-qualité-de-code)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

---

## ✨ Fonctionnalités

- 🔐 **Authentification LDAP** — Connexion avec les identifiants Windows (Active Directory)
- 🪪 **Annuaire visuel** — Fiches collaborateurs avec photo, poste, service, email, téléphone
- 📸 **Gestion des photos** — Upload et suppression (deux modes de stockage : local ou AD)
- 🔒 **Photos sécurisées** — Les images sont servies via un endpoint protégé JWT (pas d'accès public)
- 👤 **Modification par l'utilisateur** — Chaque collaborateur peut modifier ou supprimer sa propre photo de profil
- 🛡️ **Rôles dynamiques** — Droits basés sur les groupes AD (ROLE_USER / ROLE_ADMIN) avec Voter Symfony
- 🔑 **API sécurisée JWT** — Authentification stateless via JSON Web Tokens
- 🔍 **Recherche instantanée** — Filtrage avec debounce (300 ms) par nom, prénom ou service, avec skeleton de chargement
- ♾️ **Infinite scroll** — Chargement progressif par lots de 24 fiches via IntersectionObserver
- 🌙 **Dark mode** — Thème sombre avec animation circulaire (View Transition API) depuis le point de clic
- 🎬 **Animations fluides** — Transitions de page, modales animées, micro-interactions (Motion/Framer Motion)
- 💬 **Notifications toast** — Retours visuels avec barre de progression et pause au survol
- ⚡ **Cache intelligent** — Cache des données utilisateur en sessionStorage (TTL 5 min) + cache mémoire des images (Object URL)
- 📜 **Mentions légales & RGPD** — Modale intégrée accessible depuis la page de connexion et le footer
- 📱 **Responsive** — Interface adaptée mobile, tablette et desktop
- 🎨 **Personnalisable** — Nom de l'organisation et titre de l'application configurables via variables d'environnement

---

## 🏗️ Architecture

```
NexTrombi-AD/
├── client/                # Frontend React + Vite + Tailwind CSS
│   ├── .env.dist                      # Variables d'environnement (modèle)
│   ├── src/
│   │   ├── App.tsx                    # Composant principal (auth + trombinoscope)
│   │   ├── index.css                  # Styles globaux, scrollbar, View Transitions, animations toast
│   │   ├── components/
│   │   │   ├── AppNav.tsx             # Barre de navigation avec recherche desktop/mobile
│   │   │   ├── AppFooter.tsx          # Pied de page (mentions légales, lien GitHub)
│   │   │   ├── LoginPage.tsx          # Page de connexion LDAP
│   │   │   ├── UserCard.tsx           # Fiche collaborateur (photo, infos, actions)
│   │   │   ├── UserGrid.tsx           # Grille responsive avec skeleton / état vide / infinite scroll
│   │   │   ├── SecureImage.tsx        # Image protégée par JWT (fetch + cache blob)
│   │   │   ├── PhotoUploadModal.tsx   # Modale d'upload de photo (aperçu en temps réel)
│   │   │   ├── ConfirmDeleteModal.tsx # Modale de confirmation de suppression
│   │   │   ├── LegalNoticesModal.tsx  # Modale mentions légales & RGPD
│   │   │   ├── ThemeToggleButton.tsx  # Bouton soleil/lune animé (View Transition)
│   │   │   └── ToastContainer.tsx     # Notifications empilables avec barre de progression
│   │   ├── hooks/
│   │   │   ├── useAuth.ts            # Gestion de l'authentification (login/logout, rôles, token)
│   │   │   ├── useUsers.ts           # Chargement des utilisateurs + cache sessionStorage (TTL 5 min)
│   │   │   ├── useTheme.ts           # Dark mode avec View Transition API (animation circulaire)
│   │   │   ├── useToast.ts           # Système de notifications toast
│   │   │   └── useInfiniteScroll.ts  # Intersection Observer pour le chargement progressif
│   │   └── lib/
│   │       ├── imageCache.ts          # Cache mémoire des images (Map<src, ObjectURL>)
│   │       └── motionVariants.ts      # Variants d'animation réutilisables (boutons, modales, etc.)
│   └── ...
├── server/                # Backend API Symfony
│   ├── src/
│   │   ├── Controller/
│   │   │   └── ApiController.php      # Endpoints REST (users, photo CRUD, photo sécurisée)
│   │   ├── Security/
│   │   │   ├── LdapJsonAuthenticator.php  # Authentification LDAP → JWT
│   │   │   ├── LdapJitUserProvider.php    # Provider JIT (Just-In-Time) depuis l'AD
│   │   │   ├── User.php                   # Modèle utilisateur en mémoire
│   │   │   └── Voter/
│   │   │       └── UserPhotoVoter.php     # Voter : admin OU propriétaire du profil
│   │   ├── Service/
│   │   │   ├── LdapConnection.php     # Service de connexion LDAP (LdapRecord)
│   │   │   └── UploadService.php      # Validation, redimensionnement et conversion des images
│   │   ├── Entity/
│   │   │   └── UserPhoto.php          # Entité Doctrine (mode local)
│   │   └── Command/
│   │       ├── TestLdapCommand.php        # Commande de diagnostic LDAP
│   │       └── ShowLdapStructureCommand.php # Visualisation de l'arborescence AD (OUs et Conteneurs)
│   ├── config/
│   ├── compose.yaml                   # Docker : MariaDB + Samba AD (dev)
│   └── ...
└── README.md
```

Le frontend React communique avec l'API Symfony via des appels REST. L'API interroge l'Active Directory en temps réel via le protocole LDAP (librairie [LdapRecord](https://ldaprecord.com/)).

---

## 🧰 Stack technique

| Composant  | Technologie                                                               |
| ---------- | ------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, Flowbite, Motion, Lucide Icons |
| **Backend**  | Symfony 8.0, PHP ≥ 8.5, LdapRecord 4, Doctrine ORM, LexikJWT          |
| **Base de données** | MariaDB 10.11 (mode local) ou aucune BDD requise (mode AD)      |
| **Annuaire** | Active Directory (protocole LDAP/LDAPS)                                 |
| **DevOps**   | Docker Compose, GrumPHP, PHPStan, PHP CS Fixer, ESLint, Prettier, Husky |

---

## 📦 Prérequis

### Backend

- **PHP ≥ 8.5** avec les extensions : `ldap`, `gd`, `intl`, `pdo_mysql` (ou `pdo_sqlite`)
- **Composer** ≥ 2.x
- **Symfony CLI** (recommandé pour le serveur local)
- Un **Active Directory** accessible en LDAP (port 389) ou LDAPS (port 636)

### Frontend

- **Node.js ≥ 20** ou **Bun** (gestionnaire de paquets)

### Optionnel

- **Docker & Docker Compose** — pour la base de données MariaDB et/ou un AD de test local

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Cold-FR/NexTrombi-AD.git
cd NexTrombi-AD
```

### 2. Backend (Symfony)

```bash
cd server

# Installer les dépendances PHP
composer install

# Copier le fichier d'environnement et le configurer
cp .env .env.local
```

> ⚠️ **Important** : éditez le fichier `.env.local` avec vos paramètres réels (voir la section [Configuration](#-configuration)).

```bash
# Démarrer la base de données (Docker)
docker compose up -d database

# Créer la base de données et exécuter les migrations
composer db
# Ou manuellement :
# php bin/console doctrine:database:create --if-not-exists
# php bin/console doctrine:migrations:migrate --no-interaction

# Générer les clés JWT (si elles n'existent pas déjà)
php bin/console lexik:jwt:generate-keypair --skip-if-exists

# Tester la connexion LDAP
php bin/console app:test-ldap

# Démarrer le serveur de développement
composer start
# Ou : php -S localhost:8000 -t public/
```

Le serveur API est maintenant disponible sur **http://localhost:8000**.

### 3. Frontend (React)

```bash
cd client

# Installer les dépendances
bun install
# Ou : npm install

# Copier le fichier d'environnement
cp .env.dist .env

# Démarrer le serveur de développement
bun dev
# Ou : npm run dev
```

Le client est maintenant disponible sur **http://localhost:5173**.

---

## ⚙️ Configuration

### Variables d'environnement — Backend

Créez un fichier `server/.env.local` (non commité) en vous basant sur `server/.env` :

| Variable | Description | Exemple |
| --- | --- | --- |
| `APP_ENV` | Environnement Symfony | `dev` ou `prod` |
| `APP_SECRET` | Clé secrète Symfony (chaîne aléatoire) | `a1b2c3d4e5f6...` |
| `DATABASE_URL` | URL de connexion à la BDD | `mysql://user:pass@127.0.0.1:3306/trombi` |
| **LDAP** | | |
| `LDAP_HOST` | Adresse IP ou hostname du contrôleur AD | `192.168.1.10` |
| `LDAP_PORT` | Port LDAP | `389` (LDAP) ou `636` (LDAPS) |
| `LDAP_BASE_DN` | DN racine de l'annuaire | `DC=mondomaine,DC=local` |
| `LDAP_SEARCH_DN` | DN du compte de service (lecture) | `CN=SvcTrombi,OU=Services,DC=...` |
| `LDAP_SEARCH_PASSWORD` | Mot de passe du compte de service | `MotDePasseRobuste!` |
| `LDAP_USE_TLS` | Activer StartTLS | `0` ou `1` |
| **Application** | | |
| `APP_LDAP_USERS_OU` | OU dans laquelle chercher les utilisateurs | `OU=Utilisateurs,DC=...` |
| `APP_LDAP_ADMIN_GROUP` | DN du groupe AD donnant le rôle admin | `CN=GG_Admins_Trombi,OU=Groupes,DC=...` |
| `APP_LDAP_ADMIN_OU` | OU dont les membres héritent du rôle admin | `OU=NTIC` |
| `APP_PHOTO_STORAGE_MODE` | Mode de stockage des photos | `local` ou `ad` |
| `UPLOAD_FOLDER` | Dossier de stockage local des photos | `var/uploads/photos` |
| **JWT** | | |
| `JWT_SECRET_KEY` | Chemin vers la clé privée JWT | `%kernel.project_dir%/config/jwt/private.pem` |
| `JWT_PUBLIC_KEY` | Chemin vers la clé publique JWT | `%kernel.project_dir%/config/jwt/public.pem` |
| **CORS** | | |
| `CORS_ALLOW_ORIGIN` | Origines autorisées (regex) | `^https?://localhost(:[0-9]+)?$` |

### Variables d'environnement — Frontend

Créez un fichier `client/.env.local` en vous basant sur `client/.env.dist` :

| Variable | Description | Exemple |
| --- | --- | --- |
| `VITE_API_BASE_URL` | URL de l'API backend | `http://localhost:8000` |
| `VITE_APP_COMPANY_NAME` | Nom de l'organisation (affiché dans le footer et la page de connexion) | `Mairie de MaVille` |

### Mode de stockage des photos

L'application supporte deux modes de stockage des photos, configurés via `APP_PHOTO_STORAGE_MODE` :

#### Mode `local` (recommandé)

- Les photos sont stockées sur le serveur dans `server/var/uploads/photos/`
- Un enregistrement en base de données lie le `samAccountName` au fichier
- Les images sont converties en **WebP** et redimensionnées (400×400 max)
- **Nécessite** une base de données (MariaDB, MySQL, SQLite…)

#### Mode `ad`

- Les photos sont écrites directement dans l'attribut `thumbnailPhoto` de l'Active Directory
- Les images sont compressées en **JPEG 96×96** (norme Microsoft)
- Le compte de service LDAP doit avoir les **droits d'écriture** sur cet attribut
- **Aucune base de données nécessaire**

### Clés JWT

Les clés de signature JWT sont nécessaires pour l'authentification :

```bash
cd server

# Génération automatique
php bin/console lexik:jwt:generate-keypair

# Ou manuellement avec OpenSSL
openssl genpkey -out config/jwt/private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096
openssl pkey -in config/jwt/private.pem -out config/jwt/public.pem -pubout
```

## 🖥️ Utilisation

1. Ouvrez le client dans votre navigateur (par défaut http://localhost:5173)
2. Connectez-vous avec un **identifiant Active Directory** (sAMAccountName + mot de passe Windows)
3. L'annuaire des collaborateurs s'affiche sous forme de **grille de fiches**
4. Utilisez la **barre de recherche** pour filtrer par nom, prénom ou service
5. **Chaque utilisateur** peut modifier ou supprimer **sa propre photo** de profil en survolant sa fiche
6. Les **administrateurs** (membres du groupe AD configuré) peuvent gérer les photos de **tous** les profils
7. Basculez entre **mode clair et sombre** via le bouton soleil/lune (animation circulaire depuis le point de clic)
8. Consultez les **mentions légales et la politique RGPD** depuis le lien en bas de page ou sur la page de connexion

---

## 🐳 Docker (développement)

Le fichier `server/compose.yaml` fournit :

| Service | Description | Port |
| --- | --- | --- |
| `database` | MariaDB 10.11 | `3306` |
| `samba-ad` | Samba AD (contrôleur AD local de test) | `389` / `636` |

Le fichier `server/compose.override.yaml` ajoute :

| Service | Description | Port |
| --- | --- | --- |
| `phpmyadmin` | Interface web pour la BDD | `7080` |

```bash
cd server

# Démarrer tous les services
docker compose up -d

# Vérifier les logs
docker compose logs -f

# Arrêter
docker compose down
```

> Le **Samba AD** local crée un domaine `MAIRIE.LOCAL` avec le mot de passe admin `Admin12345!`.  
> Utile pour tester sans un véritable Active Directory.

---

## 🛠️ Commandes utiles

### Backend (Symfony)

| Commande                                      | Description |
|-----------------------------------------------| --- |
| `composer start`                              | Démarre le serveur web local |
| `composer db`                                 | Recrée la BDD et lance les migrations |
| `php bin/console app:test-ldap`               | Teste la connexion au serveur LDAP |
| `php bin/console app:ldap-structure`           | Affiche l'arborescence des OUs et Conteneurs de l'AD |
| `php bin/console lexik:jwt:generate-keypair`  | Génère les clés JWT |
| `php bin/console doctrine:migrations:migrate` | Applique les migrations |
| `composer test`                               | Lance tous les tests (CS Fixer + PHPStan + YAML) |
| `composer fix`                                | Corrige le formatage du code PHP |

### Frontend (React)

| Commande | Description |
| --- | --- |
| `bun dev` | Démarre le serveur de développement Vite |
| `bun run build` | Build de production (dans `dist/`) |
| `bun run preview` | Prévisualise le build de production |
| `bun run lint` | Analyse le code avec ESLint |
| `bun run lint:fix` | Corrige automatiquement les erreurs ESLint |
| `bun run format` | Formate le code avec Prettier |

---

## 📡 API Endpoints

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Auth | Rôle | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/api/login` | ❌ | Public | Authentification LDAP → retourne un token JWT |
| `GET` | `/api/users` | ✅ JWT | `ROLE_USER` | Liste tous les utilisateurs de l'OU configurée |
| `POST` | `/api/users/{id}/photo` | ✅ JWT | Admin ou propriétaire | Upload/mise à jour de la photo d'un utilisateur |
| `DELETE` | `/api/users/{id}/photo` | ✅ JWT | Admin ou propriétaire | Suppression de la photo d'un utilisateur |
| `GET` | `/api/photos/{filename}` | ✅ JWT | `ROLE_USER` | Téléchargement sécurisé d'une photo (mode local) |

> **Note :** Les endpoints `POST` et `DELETE` sur `/api/users/{id}/photo` utilisent un **Voter Symfony** (`UserPhotoVoter`) qui autorise l'action si l'utilisateur connecté est **administrateur** OU s'il est le **propriétaire du profil** ciblé.

### Exemple d'authentification

```bash
# Connexion
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "jdupont", "password": "MonMotDePasse"}'

# Réponse
# { "token": "eyJ0eXAiOiJKV1Q...", "user": "jdupont", "roles": ["ROLE_USER"] }

# Utilisation du token
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..."
```

---

## ✅ Qualité de code

Le projet intègre plusieurs outils de qualité de code :

### Backend

- **[GrumPHP](https://github.com/phpro/grumphp)** — Hook de pre-commit automatique
- **[PHPStan](https://phpstan.org/)** — Analyse statique PHP
- **[PHP CS Fixer](https://cs.symfony.com/)** — Formatage du code PHP
- **YAML Lint** — Validation des fichiers de configuration

### Frontend

- **[ESLint](https://eslint.org/)** — Analyse statique TypeScript/React
- **[Prettier](https://prettier.io/)** — Formatage du code (avec plugin Tailwind CSS)
- **[Husky](https://typicode.github.io/husky/)** — Hooks Git automatiques

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Consultez le **[Guide de contribution](CONTRIBUTING.md)** pour tout savoir sur :

- La mise en place de l'environnement de développement
- Le workflow de contribution (branches, PR, reviews)
- Les conventions de code (PHP CS Fixer, PHPStan, ESLint, Prettier)
- La convention de commits ([Conventional Commits](https://www.conventionalcommits.org/))

### Démarrage rapide

1. **Forkez** le dépôt
2. Créez une **branche** pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. **Commitez** vos changements (`git commit -m "feat: ajout de ma fonctionnalité"`)
4. **Poussez** la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une **Pull Request**

---

## 📝 Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus d'informations.

---

<p align="center">
  Fait avec ❤️ pour simplifier la gestion des trombinoscopes en entreprise.
</p>

