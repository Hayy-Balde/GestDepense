import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await authService.login({ email, password });
      setAuth(data.user, data.access_token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à GestDepense
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
              <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
          <div className="text-center text-sm">
            Pas encore de compte ? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Créer un compte</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
