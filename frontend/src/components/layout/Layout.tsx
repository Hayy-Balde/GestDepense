import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { authService } from "../../services/auth";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch(e) { console.error(e) }
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Comptes", path: "/accounts" },
    { name: "Dépenses", path: "/expenses" },
    { name: "Revenus", path: "/incomes" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-indigo-600">GestDepense</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`block px-4 py-2 rounded-md ${
                location.pathname === item.path ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-6">
          <h2 className="text-lg font-medium text-gray-800">
            {navItems.find((i) => i.path === location.pathname)?.name || "Application"}
          </h2>
          <div className="ml-auto">
            <span className="text-sm font-medium text-gray-700">{user?.name || "Utilisateur"}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
