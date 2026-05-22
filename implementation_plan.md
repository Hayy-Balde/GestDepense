# GestDepense — Plan d'Implémentation Complet

> **Stack** : Laravel 12 (API) · React 19 + TypeScript (SPA) · PostgreSQL · Redis · Docker
> **Dernière mise à jour** : Mai 2026

---

## Légende des statuts

| Icône | Statut         |
|-------|----------------|
| ✅    | Terminé        |
| 🚧    | En cours       |
| ⬜    | À faire        |
| 🔴    | Bloquant       |

---

## PHASE 0 — Infrastructure & DevOps ✅

| Tâche | Statut | Détails |
|-------|--------|---------|
| `docker-compose.yml` | ✅ | Nginx, PHP-FPM, PostgreSQL 16, Redis 7, Queue Worker, Scheduler |
| `Dockerfile.backend` | ✅ | PHP 8.3-FPM avec extensions (pdo_pgsql, redis, bcmath…) |
| `Dockerfile.frontend` | ✅ | Node 20 + Vite dev server |
| `docker/nginx/default.conf` | ✅ | Reverse proxy vers PHP-FPM sur port 8000 |
| `docker/php/local.ini` | ✅ | Paramètres PHP (upload_max_filesize, etc.) |
| `docker/supervisor/supervisord.conf` | ✅ | Supervisord pour queue + scheduler |
| `Makefile` | ✅ | Commandes `setup`, `start`, `stop`, `db-refresh`, `clean` |

---

## PHASE 1 — Backend Laravel (API RESTful) 🔴

### 1.1 Initialisation du projet
| Tâche | Statut |
|-------|--------|
| `composer create-project laravel/laravel backend` | 🔴 **MANQUANT** — dossier vide |
| Configurer `.env` (DB_CONNECTION=pgsql, CACHE_DRIVER=redis) | ⬜ |
| Installer Laravel Sanctum : `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"` | ⬜ |
| Configurer CORS (`config/cors.php`) pour accepter `http://localhost:5173` | ⬜ |

### 1.2 Migrations (Base de données)
Toutes les tables utilisent des **UUID** comme clés primaires (`HasUuids`).

| Migration | Statut | Colonnes principales |
|-----------|--------|----------------------|
| `users` | ⬜ | id (uuid), name, email, password, currency_code (défaut: GNF), email_verified_at |
| `personal_access_tokens` | ⬜ | (Sanctum — auto-généré) |
| `accounts` | ⬜ | id, user_id (FK), name, type (bank/cash/mobile_money…), balance, currency_code, is_default |
| `categories` | ⬜ | id, user_id (nullable), name, type (expense/income), icon, color, is_system, sort_order |
| `sub_categories` | ⬜ | id, category_id (FK), name, icon |
| `expenses` | ⬜ | id, user_id, account_id, category_id, sub_category_id, caisse_id, title, amount, currency_code, date, time, payment_method, status, is_recurring, recurrence_rule, description, notes |
| `incomes` | ⬜ | id, user_id, account_id, category_id, title, amount, currency_code, date, payment_method, status, description |
| `caisses` | ⬜ | id, user_id, name, budget_amount, spent_amount, icon, color, description |
| `budgets` | ⬜ | id, user_id, month, year, total_budget, notes |
| `budget_categories` | ⬜ | id, budget_id (FK), category_id (FK), allocated_amount, spent_amount |
| `savings` | ⬜ | id, user_id, name, target_amount, current_amount, deadline, icon, color, auto_save_amount, auto_save_frequency, status |
| `saving_transactions` | ⬜ | id, saving_id (FK), type (deposit/withdrawal), amount, date, note |
| `subscriptions` | ⬜ | id, user_id, account_id, name, amount, currency_code, billing_cycle, next_billing_date, icon, color, url, is_active, reminder_days_before |
| `debts` | ⬜ | id, user_id, type (lent/borrowed), person_name, person_contact, amount, remaining_amount, currency_code, due_date, description, status |
| `debt_payments` | ⬜ | id, debt_id (FK), amount, date, note |
| `tags` | ⬜ | id, user_id, name, color |
| `expense_tag` (pivot) | ⬜ | expense_id, tag_id |
| `attachments` | ⬜ | id, attachable_type, attachable_id, file_name, file_path, mime_type |

### 1.3 Models Eloquent
| Model | Statut | Relations à définir |
|-------|--------|---------------------|
| `User` | ⬜ | hasMany(Account), hasMany(Expense), hasMany(Income)… |
| `Account` | ⬜ | belongsTo(User), hasMany(Expense), hasMany(Income) |
| `Category` | ⬜ | hasMany(Expense), hasMany(Income), hasMany(SubCategory) |
| `Expense` | ⬜ | belongsTo(User, Account, Category, SubCategory, Caisse), morphMany(Attachment), belongsToMany(Tag) |
| `Income` | ⬜ | belongsTo(User, Account, Category) |
| `Caisse` | ⬜ | belongsTo(User), hasMany(Expense) — appended: `remaining`, `percentage_used` |
| `Budget` | ⬜ | belongsTo(User), hasMany(BudgetCategory) — appended: `total_spent`, `remaining` |
| `Saving` | ⬜ | belongsTo(User), hasMany(SavingTransaction) — appended: `progress`, `remaining` |
| `Subscription` | ⬜ | belongsTo(User), belongsTo(Account) — appended: `annual_cost` |
| `Debt` | ⬜ | belongsTo(User), hasMany(DebtPayment) — appended: `progress` |

### 1.4 API Controllers & Routes

**Préfixe global** : `/api/v1/`

```
/api/v1/auth/register   POST  → AuthController@register
/api/v1/auth/login      POST  → AuthController@login
/api/v1/auth/logout     POST  → AuthController@logout (auth:sanctum)
/api/v1/auth/user       GET   → AuthController@user (auth:sanctum)

/api/v1/accounts        GET, POST          → AccountController
/api/v1/accounts/{id}   GET, PUT, DELETE   → AccountController

/api/v1/categories      GET, POST          → CategoryController
/api/v1/categories/{id} GET, PUT, DELETE   → CategoryController

/api/v1/expenses        GET, POST          → ExpenseController (filtres: category_id, account_id, page)
/api/v1/expenses/{id}   GET, PUT, DELETE   → ExpenseController

/api/v1/incomes         GET, POST          → IncomeController
/api/v1/incomes/{id}    GET, PUT, DELETE   → IncomeController

/api/v1/caisses         GET, POST          → CaisseController
/api/v1/caisses/{id}    GET, PUT, DELETE   → CaisseController

/api/v1/budgets         GET, POST          → BudgetController
/api/v1/budgets/{id}    GET, PUT, DELETE   → BudgetController

/api/v1/savings         GET, POST          → SavingController
/api/v1/savings/{id}    GET, PUT, DELETE   → SavingController
/api/v1/savings/{id}/deposit    POST       → SavingController@deposit
/api/v1/savings/{id}/withdraw   POST       → SavingController@withdraw

/api/v1/subscriptions   GET, POST          → SubscriptionController
/api/v1/subscriptions/{id} GET, PUT, DELETE → SubscriptionController

/api/v1/debts           GET, POST          → DebtController
/api/v1/debts/{id}      GET, PUT, DELETE   → DebtController
/api/v1/debts/{id}/pay  POST               → DebtController@addPayment

/api/v1/dashboard       GET → DashboardController@overview
/api/v1/dashboard/monthly GET → DashboardController@monthly (params: month, year)
```

| Controller | Statut |
|------------|--------|
| `AuthController` | ⬜ |
| `AccountController` | ⬜ |
| `CategoryController` | ⬜ |
| `ExpenseController` | ⬜ |
| `IncomeController` | ⬜ |
| `CaisseController` | ⬜ |
| `BudgetController` | ⬜ |
| `SavingController` | ⬜ |
| `SubscriptionController` | ⬜ |
| `DebtController` | ⬜ |
| `DashboardController` | ⬜ |

### 1.5 Seeders & Factories
| Tâche | Statut |
|-------|--------|
| `CategorySeeder` — catégories système (alimentation, transport, salaire…) | ⬜ |
| `UserSeeder` — utilisateur de démo | ⬜ |
| `DatabaseSeeder` — orchestration des seeders | ⬜ |

---

## PHASE 2 — Frontend React (SPA) 🚧

### 2.1 Configuration & Architecture ✅
| Tâche | Statut |
|-------|--------|
| Vite + React 19 + TypeScript | ✅ |
| TailwindCSS 4 + shadcn/ui (Radix) | ✅ |
| Zustand (authStore, uiStore, monthStore) | ✅ |
| Axios + intercepteurs (Bearer Token, 401 auto-logout) | ✅ |
| React Router v7 | ✅ |
| Framer Motion (animations sidebar) | ✅ |
| Types TypeScript complets (Expense, Budget, Saving, Debt…) | ✅ |
| Constantes métier (ACCOUNT_TYPES, CURRENCIES, PAYMENT_METHODS…) | ✅ |

### 2.2 Layout & Navigation
| Tâche | Statut |
|-------|--------|
| Sidebar collapsible avec sections groupées | ✅ |
| Mobile overlay (hamburger + overlay backdrop) | ✅ |
| Header avec navigation mois (monthStore) | ✅ |
| ProtectedRoute (redirection si non authentifié) | ✅ |
| AppLayout (Sidebar + Header + `<Outlet>`) | ✅ |
| **Router.tsx — routes françaises cohérentes** | ✅ **(Corrigé)** |
| **Toutes les pages enregistrées dans le router** | ✅ **(Corrigé)** |

### 2.3 Authentification
| Tâche | Statut |
|-------|--------|
| `LoginPage` — formulaire email/password avec gestion d'erreurs | ✅ |
| `RegisterPage` — formulaire inscription | ✅ |
| `ForgotPasswordPage` — demande de reset | 🚧 stub |
| `VerifyEmailPage` — vérification email | 🚧 stub |
| **Suppression des doublons (pages/auth/ vs pages/)** | ✅ **(Corrigé)** |
| authStore persisté dans localStorage | ✅ |

### 2.4 Dépenses (module le plus avancé)
| Tâche | Statut |
|-------|--------|
| `ExpensesPage` — page principale | ✅ |
| `ExpenseList` — tableau avec filtres (compte, catégorie, recherche) | ✅ |
| `ExpenseList` — pagination Laravel | ✅ |
| `ExpenseList` — suppression avec confirmation | ✅ |
| `ExpenseForm` — création avec Zod validation | ✅ |
| **ExpenseForm — debit_card dans schema Zod** | ✅ **(Corrigé)** |
| **ExpenseForm — currency dynamique (user.currency_code)** | ✅ **(Corrigé)** |
| `ExpenseForm` — édition (mise à jour) | ⬜ |
| Filtres date (date_from / date_to) | ⬜ |
| Export CSV | ⬜ |

### 2.5 Dashboard
| Tâche | Statut |
|-------|--------|
| Cartes KPI (solde, revenus, dépenses) | 🚧 mock |
| **Appel API réel `/api/v1/dashboard`** | ✅ **(Corrigé)** |
| Graphique tendances (Recharts) | ⬜ |
| Transactions récentes | ⬜ |
| Sélecteur de mois (monthStore) | ⬜ |

### 2.6 Autres modules (stubs — à implémenter)
| Module | Page | Service API | Statut |
|--------|------|-------------|--------|
| Comptes | `AccountsPage` | `accountService` | ⬜ UI stub |
| Revenus | `IncomesPage` | `incomeService` | ⬜ UI stub |
| Caisses | `CaissesPage` | `caisseService` | ⬜ UI stub |
| Budgets | `BudgetsPage` | `budgetService` | ⬜ UI stub |
| Épargnes | `SavingsPage` | `savingService` | ⬜ UI stub |
| Abonnements | `SubscriptionsPage` | `subscriptionService` | ⬜ UI stub |
| Dettes | `DebtsPage` | `debtService` | ⬜ UI stub |
| Analytiques | `AnalyticsPage` | (dashboard API) | ⬜ UI stub |
| Paramètres | `SettingsPage` | (user API) | ⬜ UI stub |

### 2.7 Services API frontend (à créer dans `services/api.ts`)
| Service | Statut |
|---------|--------|
| `expenseService` (getAll, create, update, delete) | ✅ |
| `accountService` (getAll, getById) | ✅ |
| `categoryService` (getAll) | ✅ |
| `authService` (login, register, logout, getUser) | ✅ |
| `incomeService` | ⬜ |
| `caisseService` | ⬜ |
| `budgetService` | ⬜ |
| `savingService` | ⬜ |
| `subscriptionService` | ⬜ |
| `debtService` | ⬜ |
| `dashboardService` | ⬜ |

---

## PHASE 3 — Fonctionnalités avancées ⬜

| Fonctionnalité | Priorité | Statut |
|----------------|----------|--------|
| Recurring expenses (cron via Scheduler) | Haute | ⬜ |
| Notifications de rappel (abonnements, dettes) | Haute | ⬜ |
| Export PDF/CSV des transactions | Moyenne | ⬜ |
| Import CSV bancaire | Moyenne | ⬜ |
| Multi-devise avec taux de change | Moyenne | ⬜ |
| Graphiques analytiques avancés (Recharts) | Moyenne | ⬜ |
| Pièces jointes (reçus, factures) | Basse | ⬜ |
| Tags sur les dépenses | Basse | ⬜ |

---

## PHASE 4 — Production ⬜

| Tâche | Statut |
|-------|--------|
| Dockerfile production (build multi-stage) | ⬜ |
| Variables d'environnement production (.env.production) | ⬜ |
| CI/CD GitHub Actions | ⬜ |
| Tests PHPUnit (Feature tests API) | ⬜ |
| Tests Vitest (composants React) | ⬜ |
| HTTPS + certificat SSL | ⬜ |

---

## Problèmes identifiés & corrections appliquées

### 🔴 Critiques (corrigés dans cette session)

1. **`implementation_plan.md` vide** → Ce fichier
2. **Router.tsx incohérent** → Routes unifiées en français (`/depenses`, `/revenus`, `/comptes`…), toutes les pages ajoutées
3. **Pages auth dupliquées** → `pages/LoginPage.tsx` et `pages/RegisterPage.tsx` (racine) supprimés — le router pointe vers `pages/auth/`

### 🟡 Bugs corrigés

4. **`debit_card` absent du schema Zod** dans `ExpenseForm` → Ajouté
5. **Currency hardcodée 'EUR'** → Remplacée par `user?.currency_code || 'GNF'` depuis authStore
6. **DashboardPage avec données mock** → Appel API réel avec fallback

### 🔴 Reste à faire (non corrigé ici — backend manquant)

- **Initialiser Laravel** : `composer create-project laravel/laravel backend`
- Créer toutes les migrations, models, controllers listés en Phase 1
- Connecter les pages stubs du frontend à leurs APIs respectives

