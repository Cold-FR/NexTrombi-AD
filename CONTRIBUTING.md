# 🤝 Guide de contribution

Merci de votre intérêt pour **NexTrombi-AD** ! Ce guide vous explique comment contribuer efficacement au projet.

## 📋 Table des matières

- [Prérequis](#-prérequis)
- [Mise en place de l'environnement](#-mise-en-place-de-lenvironnement)
- [Workflow de contribution](#-workflow-de-contribution)
- [Conventions de code](#-conventions-de-code)
- [Convention de commits](#-convention-de-commits)
- [Structure du projet](#-structure-du-projet)
- [Soumettre une Pull Request](#-soumettre-une-pull-request)
- [Signaler un bug](#-signaler-un-bug)
- [Proposer une fonctionnalité](#-proposer-une-fonctionnalité)

---

## 🛠 Prérequis

Assurez-vous d'avoir installé les outils suivants :

| Outil | Version minimale | Usage |
|-------|-----------------|-------|
| **PHP** | ≥ 8.5 | Backend Symfony |
| **Composer** | ≥ 2.x | Dépendances PHP |
| **Node.js** | ≥ 20.x | Frontend React |
| **Bun** | ≥ 1.x | Package manager frontend (ou npm/yarn) |
| **Docker & Docker Compose** | Dernière stable | Base de données & AD local |
| **Git** | ≥ 2.x | Versionnement |

---

## 🚀 Mise en place de l'environnement

### 1. Forker et cloner

```bash
# Forker le dépôt sur GitHub (https://github.com/Cold-FR/NexTrombi-AD), puis :
git clone https://github.com/<votre-utilisateur>/NexTrombi-AD.git
cd NexTrombi-AD
```

### 2. Backend (Symfony)

```bash
cd server
composer install
# Copier et configurer les variables d'environnement
cp .env .env.local
# Lancer les conteneurs Docker (MariaDB + Samba AD)
docker compose up -d
# Créer la base de données et lancer les migrations
composer db
```

### 3. Frontend (React)

```bash
cd client
bun install      # ou npm install
# Copier et configurer les variables d'environnement
cp .env .env.local
```

### 4. Lancer le projet

```bash
# Terminal 1 — Backend
cd server
composer start

# Terminal 2 — Frontend
cd client
bun run dev      # ou npm run dev
```

---

## 🔄 Workflow de contribution

1. **Créez une branche** à partir de `main` :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   # ou
   git checkout -b fix/correction-du-bug
   ```

2. **Développez** votre modification en respectant les conventions ci-dessous.

3. **Testez** votre code localement :
   ```bash
   # Backend
   cd server
   composer test

   # Frontend
   cd client
   bun run lint
   bun run format:check
   bun run build
   ```

4. **Commitez** en suivant la convention Conventional Commits.

5. **Poussez** votre branche et ouvrez une Pull Request.

---

## 🎨 Conventions de code

### Backend (PHP / Symfony)

- **PHP CS Fixer** — Le code doit respecter les règles définies dans `.php-cs-fixer.dist.php`
- **PHPStan** — Analyse statique (niveau configuré dans `phpstan.dist.neon`)
- **GrumPHP** — Exécute automatiquement les vérifications avant chaque commit

```bash
# Vérifier le code
composer test:csfixer
composer test:phpstan

# Corriger automatiquement le formatage
composer fix:csfixer
```

### Frontend (TypeScript / React)

- **ESLint** — Linting TypeScript/React selon `eslint.config.js`
- **Prettier** — Formatage avec le plugin Tailwind CSS pour l'ordre des classes
- **Husky** — Hook pre-commit pour le frontend

```bash
# Vérifier
bun run lint
bun run format:check

# Corriger
bun run lint:fix
bun run format
```

### Règles générales

- Encodage : **UTF-8**
- Fins de ligne : **LF** (Unix)
- Toujours terminer les fichiers par une ligne vide
- Pas d'espaces en fin de ligne

---

## 📝 Convention de commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
<type>(<scope>): <description in english>
```

### Types autorisés

| Type | Description |
|------|-------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage (pas de changement de logique) |
| `refactor` | Refactorisation de code |
| `perf` | Amélioration des performances |
| `test` | Ajout ou modification de tests |
| `chore` | Tâches de maintenance (dépendances, CI, etc.) |
| `ci` | Changements liés à l'intégration continue |

### Portées courantes

- `client` — Frontend React
- `server` — Backend Symfony
- `docker` — Configuration Docker
- `deps` — Dépendances

### Exemples

```
feat(client): add theme toggle button
fix(server): fix LDAP authentication with accents
docs: update README with new environment variables
chore(deps): bump Symfony to 8.0.3
refactor(server): extract photo resizing logic to UploadService
```

---

## 📂 Structure du projet

```
NexTrombi-AD/
├── client/               # Frontend React + Vite + Tailwind v4
│   ├── src/
│   │   ├── components/   # Composants React réutilisables
│   │   ├── hooks/        # Hooks personnalisés
│   │   ├── App.tsx       # Composant racine
│   │   └── index.css     # Styles Tailwind
│   └── public/           # Fichiers statiques
├── server/               # Backend Symfony 8
│   ├── src/
│   │   ├── Command/      # Commandes console
│   │   ├── Controller/   # Contrôleurs API
│   │   ├── Entity/       # Entités Doctrine
│   │   ├── Repository/   # Repositories Doctrine
│   │   ├── Security/     # Authentification LDAP & JWT
│   │   └── Service/      # Services métier
│   ├── config/           # Configuration Symfony
│   └── migrations/       # Migrations Doctrine
├── CONTRIBUTING.md       # Ce fichier
└── LICENSE               # Licence MIT
```

---

## 🚀 Soumettre une Pull Request

1. Assurez-vous que votre branche est à jour avec `main` :
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. Vérifiez que **tous les outils de qualité passent** (linters, formatters, build).

3. Ouvrez votre Pull Request avec :
   - Un **titre** suivant la convention de commits
   - Une **description** claire de ce qui a été changé et pourquoi
   - Des **captures d'écran** si c'est un changement visuel
   - La mention des **issues** liées (ex : `Closes #42`)

4. Attendez la **review** d'un mainteneur. Soyez réactif aux retours.

---

## 🐛 Signaler un bug

Ouvrez une [issue](https://github.com/Cold-FR/NexTrombi-AD/issues/new) avec :

- **Description** claire du problème
- **Étapes de reproduction** détaillées
- **Comportement attendu** vs **comportement observé**
- **Environnement** (OS, navigateur, versions PHP/Node)
- **Captures d'écran** si applicable

---

## 💡 Proposer une fonctionnalité

Ouvrez une [issue](https://github.com/Cold-FR/NexTrombi-AD/issues/new) avec :

- **Description** de la fonctionnalité souhaitée
- **Motivation** — Quel problème cela résout ?
- **Solution proposée** — Comment l'implémenter ?
- **Alternatives envisagées** (si applicable)

---

## ❓ Questions ?

Si vous avez des questions, n'hésitez pas à ouvrir une **issue** avec le label `question`.

---

Merci pour votre contribution ! 🎉

