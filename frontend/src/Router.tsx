import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Auth pages
const LoginPage       = React.lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage    = React.lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPassword  = React.lazy(() => import("./pages/auth/ForgotPasswordPage"));
const VerifyEmail     = React.lazy(() => import("./pages/auth/VerifyEmailPage"));
const ResetPassword   = React.lazy(() => import("./pages/auth/ResetPasswordPage"));
const CallbackPage    = React.lazy(() => import("./pages/auth/CallbackPage"));

// App pages
const DashboardPage     = React.lazy(() => import("./pages/DashboardPage"));
const ExpensesPage      = React.lazy(() => import("./pages/ExpensesPage"));
const IncomesPage       = React.lazy(() => import("./pages/IncomesPage"));
const AccountsPage      = React.lazy(() => import("./pages/AccountsPage"));
const CaissesPage       = React.lazy(() => import("./pages/CaissesPage"));
const MouvementsPage    = React.lazy(() => import("./pages/MouvementsPage"));
const MigrationPage     = React.lazy(() => import("./pages/MigrationPage"));
const ReportsPage       = React.lazy(() => import("./pages/ReportsPage"));
const SavingsPage       = React.lazy(() => import("./pages/SavingsPage"));
const BudgetsPage       = React.lazy(() => import("./pages/BudgetsPage"));
const SubscriptionsPage = React.lazy(() => import("./pages/SubscriptionsPage"));
const DebtsPage         = React.lazy(() => import("./pages/DebtsPage"));
const InvoicesPage      = React.lazy(() => import("./pages/InvoicesPage"));
const AnalyticsPage     = React.lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage      = React.lazy(() => import("./pages/SettingsPage"));
const NotFoundPage      = React.lazy(() => import("./pages/NotFoundPage"));
const ErrorPage         = React.lazy(() => import("./pages/ErrorPage"));

// Config pages
const AccountTypesPage    = React.lazy(() => import("./pages/config/AccountTypesPage"));
const PaymentMethodsPage  = React.lazy(() => import("./pages/config/PaymentMethodsPage"));
const BillingCyclesPage   = React.lazy(() => import("./pages/config/BillingCyclesPage"));
const DebtTypesPage       = React.lazy(() => import("./pages/config/DebtTypesPage"));
const CurrenciesPage      = React.lazy(() => import("./pages/config/CurrenciesPage"));
const CategoriesPage      = React.lazy(() => import("./pages/config/CategoriesPage"));
const ConfigIndexPage     = React.lazy(() => import("./pages/config/ConfigIndexPage"));

const Fallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const router = createBrowserRouter([
  {
    errorElement: (
      <React.Suspense fallback={<Fallback />}>
        <ErrorPage />
      </React.Suspense>
    ),
    children: [
      // Auth routes (publiques)
      {
    path: "/connexion",
    element: <React.Suspense fallback={<Fallback />}><LoginPage /></React.Suspense>,
  },
  {
    path: "/inscription",
    element: <React.Suspense fallback={<Fallback />}><RegisterPage /></React.Suspense>,
  },
  {
    path: "/mot-de-passe-oublie",
    element: <React.Suspense fallback={<Fallback />}><ForgotPassword /></React.Suspense>,
  },
  {
    path: "/verifier-email",
    element: <React.Suspense fallback={<Fallback />}><VerifyEmail /></React.Suspense>,
  },
  {
    path: "/reinitialiser-mot-de-passe",
    element: <React.Suspense fallback={<Fallback />}><ResetPassword /></React.Suspense>,
  },
  {
    path: "/auth/callback",
    element: <React.Suspense fallback={<Fallback />}><CallbackPage /></React.Suspense>,
  },
  // Redirections de compatibilité (anciennes routes anglaises)
  {
    path: "/login",
    element: <React.Suspense fallback={<Fallback />}><LoginPage /></React.Suspense>,
  },
  {
    path: "/register",
    element: <React.Suspense fallback={<Fallback />}><RegisterPage /></React.Suspense>,
  },

  // App routes (protégées)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <React.Suspense fallback={<Fallback />}><DashboardPage /></React.Suspense>,
      },
      // Dépenses & Revenus
      {
        path: "depenses",
        element: <React.Suspense fallback={<Fallback />}><ExpensesPage /></React.Suspense>,
      },
      {
        path: "revenus",
        element: <React.Suspense fallback={<Fallback />}><IncomesPage /></React.Suspense>,
      },
      // Comptes
      {
        path: "comptes",
        element: <React.Suspense fallback={<Fallback />}><AccountsPage /></React.Suspense>,
      },
      // Finances
      {
        path: "caisses",
        element: <React.Suspense fallback={<Fallback />}><CaissesPage /></React.Suspense>,
      },
      {
        path: "mouvements",
        element: <React.Suspense fallback={<Fallback />}><MouvementsPage /></React.Suspense>,
      },
      {
        path: "migration",
        element: <React.Suspense fallback={<Fallback />}><MigrationPage /></React.Suspense>,
      },
      {
        path: "rapports",
        element: <React.Suspense fallback={<Fallback />}><ReportsPage /></React.Suspense>,
      },
      {
        path: "epargnes",
        element: <React.Suspense fallback={<Fallback />}><SavingsPage /></React.Suspense>,
      },
      {
        path: "budgets",
        element: <React.Suspense fallback={<Fallback />}><BudgetsPage /></React.Suspense>,
      },
      // Autres
      {
        path: "abonnements",
        element: <React.Suspense fallback={<Fallback />}><SubscriptionsPage /></React.Suspense>,
      },
      {
        path: "dettes",
        element: <React.Suspense fallback={<Fallback />}><DebtsPage /></React.Suspense>,
      },
      {
        path: "factures",
        element: <React.Suspense fallback={<Fallback />}><InvoicesPage /></React.Suspense>,
      },
      {
        path: "analytiques",
        element: <React.Suspense fallback={<Fallback />}><AnalyticsPage /></React.Suspense>,
      },
      {
        path: "parametres",
        element: <React.Suspense fallback={<Fallback />}><SettingsPage /></React.Suspense>,
      },
      // Configuration
      {
        path: "configuration",
        element: <React.Suspense fallback={<Fallback />}><ConfigIndexPage /></React.Suspense>,
      },
      {
        path: "configuration/types-de-comptes",
        element: <React.Suspense fallback={<Fallback />}><AccountTypesPage /></React.Suspense>,
      },
      {
        path: "configuration/methodes-de-paiement",
        element: <React.Suspense fallback={<Fallback />}><PaymentMethodsPage /></React.Suspense>,
      },
      {
        path: "configuration/cycles-de-facturation",
        element: <React.Suspense fallback={<Fallback />}><BillingCyclesPage /></React.Suspense>,
      },
      {
        path: "configuration/types-de-dette",
        element: <React.Suspense fallback={<Fallback />}><DebtTypesPage /></React.Suspense>,
      },
      {
        path: "configuration/devises",
        element: <React.Suspense fallback={<Fallback />}><CurrenciesPage /></React.Suspense>,
      },
      {
        path: "configuration/categories",
        element: <React.Suspense fallback={<Fallback />}><CategoriesPage /></React.Suspense>,
      },
    ],
  },

  // 404
  {
    path: "*",
    element: <React.Suspense fallback={<Fallback />}><NotFoundPage /></React.Suspense>,
  },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
