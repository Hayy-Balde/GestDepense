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
const SavingsPage       = React.lazy(() => import("./pages/SavingsPage"));
const BudgetsPage       = React.lazy(() => import("./pages/BudgetsPage"));
const SubscriptionsPage = React.lazy(() => import("./pages/SubscriptionsPage"));
const DebtsPage         = React.lazy(() => import("./pages/DebtsPage"));
const AnalyticsPage     = React.lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage      = React.lazy(() => import("./pages/SettingsPage"));
const NotFoundPage      = React.lazy(() => import("./pages/NotFoundPage"));

const Fallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const router = createBrowserRouter([
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
        path: "analytiques",
        element: <React.Suspense fallback={<Fallback />}><AnalyticsPage /></React.Suspense>,
      },
      {
        path: "parametres",
        element: <React.Suspense fallback={<Fallback />}><SettingsPage /></React.Suspense>,
      },
    ],
  },

  // 404
  {
    path: "*",
    element: <React.Suspense fallback={<Fallback />}><NotFoundPage /></React.Suspense>,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
