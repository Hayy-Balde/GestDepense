import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
