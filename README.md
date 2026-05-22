# GestDepense — SaaS Premium de Gestion Financière

GestDepense est une application web fullstack de gestion financière personnelle, développée avec **Laravel 12** (API Backend) et **React 19** (Frontend). Le projet est conteneurisé via Docker pour simplifier l'environnement de développement.

---

## 🏗 Architecture du Projet

Le projet est divisé en deux dossiers principaux :
- `/backend` : API RESTful (Laravel, PHP 8.3, PostgreSQL).
- `/frontend` : Single Page Application (React, TypeScript, TailwindCSS, Zustand).

---

## 🚀 Procédure de Lancement (Environnement de Développement)

### Prérequis
Assurez-vous d'avoir installé sur votre machine :
- **Docker** & **Docker Compose**
- **Node.js** (v18+) & **npm**

### Étape 1 : Démarrer le Backend (Laravel API)

Le backend utilise Docker via l'infrastructure `docker-compose.yml` fournie.

1. **Aller dans le dossier backend :**
   ```bash
   cd backend
   ```

2. **Installer les dépendances PHP (Si vous avez Composer en local) :**
   ```bash
   composer install
   ```
   *Note: Si vous n'avez pas PHP en local, vous pouvez lancer le conteneur `app` d'abord, puis exécuter `docker compose exec app composer install`.*

3. **Générer le fichier d'environnement :**
   Le fichier `.env` a déjà été configuré pour pointer vers la base de données PostgreSQL Dockerisée. Si ce n'est pas le cas :
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Lancer les conteneurs Docker (Nginx, PHP, PostgreSQL) :**
   ```bash
   docker compose up -d
   ```

5. **Exécuter les Migrations de la Base de Données :**
   Une fois la base de données démarrée, créez les tables (avec l'intégrité UUID et les clés étrangères) :
   ```bash
   docker compose exec app php artisan migrate
   ```

L'API Backend sera accessible sur : **http://localhost:8000**

### Étape 2 : Démarrer le Frontend (React SPA)

Le frontend utilise Vite comme bundler de développement.

1. **Aller dans le dossier frontend :**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances NPM :**
   ```bash
   npm install
   ```

3. **Configurer l'environnement :**
   Copiez `.env.example` s'il existe, ou assurez-vous que `VITE_API_URL` pointe bien vers votre backend local.
   ```bash
   # Optionnel si l'API n'est pas sur le port par défaut :
   # echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
   ```

4. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

L'interface web sera accessible sur : **http://localhost:5173** (par défaut avec Vite).

---

## 🔗 Procédure d'Intégration (API & Frontend)

### Authentification (Sanctum)
L'application utilise **Laravel Sanctum** avec l'authentification par **Bearer Token (JWT)**.
- Lors de l'appel à `/api/v1/auth/login`, l'API renvoie un token `access_token`.
- Ce token est stocké dans le `localStorage` du frontend par `Zustand` (`authStore.ts`).
- L'instance `axios` (dans `frontend/src/services/api.ts`) intercepte automatiquement toutes les requêtes sortantes pour y ajouter le header : `Authorization: Bearer <token>`.

### Gestion des Erreurs et Expiration
Si le Backend renvoie une erreur `401 Unauthorized` (Token expiré ou invalide), l'intercepteur réseau d'Axios déconnectera automatiquement l'utilisateur et le redirigera vers la page de `/login`.

### Conventions API
* Toutes les URL de l'API commencent par le préfixe : `/api/v1/`
* Le format de requête et de réponse attendu est toujours `application/json`.
* Toutes les entités principales (Comptes, Dépenses, Revenus, Budgets, Caisses) utilisent des **UUID** en tant qu'identifiants primaires, générés automatiquement côté serveur (`HasUuids`).

---

## 🛠 Commandes Utiles

**Vider le cache du Backend :**
```bash
docker compose exec app php artisan optimize:clear
```

**Re-générer les données (Seeders - Bientôt disponibles) :**
```bash
docker compose exec app php artisan migrate:fresh --seed
```

**Construire le Frontend pour la Production :**
```bash
cd frontend && npm run build
```
