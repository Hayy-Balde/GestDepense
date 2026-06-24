# GestDepense — SaaS Premium de Gestion Financière

GestDepense est une application web fullstack de gestion financière personnelle, développée avec **Laravel 12** (API Backend) et **React 19** (Frontend).

---

## 🏗 Architecture du Projet

Le projet est divisé en deux dossiers principaux :
- `/backend` : API RESTful (Laravel, PHP 8.3, PostgreSQL).
- `/frontend` : Single Page Application (React, TypeScript, TailwindCSS, Zustand).

---

## 🚀 Procédure de Lancement (Environnement de Développement)

### Prérequis
Assurez-vous d'avoir installé sur votre machine :
- **PHP** (8.3+) & **Composer**
- **Node.js** (v18+) & **npm**
- **PostgreSQL** (16+)

### Étape 1 : Démarrer le Backend (Laravel API)

1. **Aller dans le dossier backend :**
   ```bash
   cd backend
   ```

2. **Installer les dépendances PHP :**
   ```bash
   composer install
   ```

3. **Générer le fichier d'environnement :**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Configurer la base de données :**
   Éditez le fichier `.env` et paramétrez vos accès PostgreSQL :
   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=gestdepense
   DB_USERNAME=postgres
   DB_PASSWORD=votre_mot_de_passe
   ```

5. **Exécuter les Migrations :**
   ```bash
   php artisan migrate
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
   ```bash
   echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
   ```

4. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

L'interface web sera accessible sur : **http://localhost:5173** (par défaut avec Vite).

---

## 🔗 Procédure d'Intégration (API & Frontend)

### Authentification (Sanctum)
L'application utilise **Laravel Sanctum** avec l'authentification par **Bearer Token**.
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

**Construire le Frontend pour la Production :**
```bash
cd frontend && npm run build
```
