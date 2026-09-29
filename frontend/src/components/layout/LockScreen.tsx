import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, KeyRound, Loader2, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/auth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const IDLE_LOCK_MS = 5 * 60 * 1000;
const IDLE_LOGOUT_MS = 20 * 60 * 1000;
const STORAGE_KEY = "ft_last_activity";
const CHECK_INTERVAL = 5000;

function readLastActivity(): number {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
}

export function LockScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lastActivityRef = useRef(readLastActivity());

  const recordActivity = useCallback(() => {
    if (locked) return;
    lastActivityRef.current = Date.now();
    localStorage.setItem(STORAGE_KEY, String(lastActivityRef.current));
  }, [locked]);

  const handleLogout = useCallback(() => {
    authService.logout().catch(() => {
      // ignore — le token est supprimé localement de toute façon
    });
    localStorage.removeItem(STORAGE_KEY);
    logout();
  }, [logout]);

  useEffect(() => {
    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];
    events.forEach((eventName) => window.addEventListener(eventName, recordActivity));
    window.addEventListener("storage", recordActivity);

    const manualLock = () => {
      lastActivityRef.current = Date.now();
      localStorage.setItem(STORAGE_KEY, String(lastActivityRef.current));
      setPassword("");
      setError("");
      setLocked(true);
    };
    window.addEventListener("ft-lock-manual", manualLock);

    const interval = window.setInterval(() => {
      const delta = Date.now() - lastActivityRef.current;
      if (delta >= IDLE_LOGOUT_MS) {
        handleLogout();
        return;
      }
      if (delta >= IDLE_LOCK_MS) {
        setLocked(true);
      }
    }, CHECK_INTERVAL);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener("storage", recordActivity);
      window.removeEventListener("ft-lock-manual", manualLock);
      window.clearInterval(interval);
    };
  }, [recordActivity, handleLogout]);

  useEffect(() => {
    if (!locked) return;
    const delta = Date.now() - lastActivityRef.current;
    if (delta >= IDLE_LOGOUT_MS) {
      handleLogout();
    }
  }, [locked, handleLogout]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await authService.verifyPassword(password);
      lastActivityRef.current = Date.now();
      localStorage.setItem(STORAGE_KEY, String(lastActivityRef.current));
      setPassword("");
      setLocked(false);
    } catch {
      setError("Mot de passe incorrect.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-4 rounded-full bg-[var(--primary)]/10 mb-4">
            <Lock className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Session verrouillée</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Entrez votre mot de passe pour continuer.
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
              className="pl-9"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)]">{error}</p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Déverrouiller
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
