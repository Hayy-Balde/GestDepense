import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ExpensesPage from "./pages/ExpensesPage";

// Lazy loading pages
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const AccountsPage = React.lazy(() => import("./pages/AccountsPage"));
const IncomesPage = React.lazy(() => import("./pages/IncomesPage"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));

const router = createBrowserRouter([
  {
    path: "/login",
    element: <React.Suspense fallback={<div>Loading...</div>}><LoginPage /></React.Suspense>,
  },
  {
    path: "/register",
    element: <React.Suspense fallback={<div>Loading...</div>}><RegisterPage /></React.Suspense>,
  },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <React.Suspense fallback={<div>Loading...</div>}><DashboardPage /></React.Suspense>,
      },
      {
        path: "expenses",
        element: <ExpensesPage />,
      },
      {
        path: "accounts",
        element: <React.Suspense fallback={<div>Loading...</div>}><AccountsPage /></React.Suspense>,
      },
      {
        path: "incomes",
        element: <React.Suspense fallback={<div>Loading...</div>}><IncomesPage /></React.Suspense>,
      }
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
