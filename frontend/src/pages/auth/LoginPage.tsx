import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { remember: true } });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    try {
      const res = await authService.login(data);
      setAuth(res.user, res.access_token);
      navigate("/", { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || "Email ou mot de passe incorrect.";
      setServerError(msg);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à votre tableau de bord"
      icon={<LogIn className="w-6 h-6" />}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-[var(--destructive-bg)] border border-[var(--destructive-border)] text-sm text-[var(--destructive)]"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </motion.div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
            <Input
              type="email"
              placeholder="vous@exemple.com"
              className="pl-10 h-11 bg-[var(--secondary)]/50 border-[var(--input)] focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              {...register("email", {
                required: "L'email est requis",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email invalide",
                },
              })}
            />
          </div>
          {errors.email && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[var(--destructive)]">
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Mot de passe</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Votre mot de passe"
              className="pl-10 pr-10 h-11 bg-[var(--secondary)]/50 border-[var(--input)] focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              {...register("password", {
                required: "Le mot de passe est requis",
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[var(--destructive)]">
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              {...register("remember")}
              className="w-4 h-4 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
            />
            <span className="text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
              Se souvenir de moi
            </span>
          </label>
          <Link
            to="/mot-de-passe-oublie"
            className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-shadow">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connexion...
            </span>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--card)] px-2 text-[var(--muted-foreground)]">Ou continuer avec</span>
        </div>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://gestdepense-api.onrender.com'}/api/auth/google/redirect`}
          className="flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </a>
        <button
          type="button"
          disabled
          className="flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted-foreground)] opacity-50 cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Apple
        </button>
      </div>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        Pas encore de compte ?{" "}
        <Link to="/inscription" className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold transition-colors">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
