import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AlertCircle } from "lucide-react";
import type { User } from "@/types/auth";

/**
 * Retour de la connexion Google.
 *
 * L'API ne place plus le jeton d'accès dans l'URL : elle y met un code opaque à
 * usage unique, échangé contre le jeton par un appel POST. Ainsi le code ne se
 * retrouve ni dans l'historique du navigateur, ni dans le `Referer` des
 * requêtes suivantes, ni dans les logs du CDN.
 */
export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const done = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = searchParams.get("code");

    if (!code) {
      navigate("/connexion", { replace: true });
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await apiPostExchange(code, controller.signal);
        setAuth(res.user, res.access_token);
        // Le code a été consommé : il ne doit pas rester dans l'historique.
        navigate("/", { replace: true });
      } catch {
        setError("La connexion n'a pas pu aboutir. Veuillez réessayer.");
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <div className="flex items-start gap-2 rounded-lg border border-[var(--destructive-border)] bg-[var(--destructive-bg)] p-3 text-sm text-[var(--destructive)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/connexion", { replace: true })}
          className="text-sm font-medium text-[var(--primary)] hover:opacity-80"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

function apiPostExchange(code: string, signal: AbortSignal) {
  const base = (import.meta.env.VITE_API_URL || "http://localhost:12000/api/v1").replace(/\/api\/v1\/?$/, "");

  return fetch(`${base}api/auth/oauth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ code }),
    signal,
  }).then(async (response) => {
    if (!response.ok) throw new Error("exchange_failed");
    return response.json() as Promise<{ access_token: string; user: User }>;
  });
}
