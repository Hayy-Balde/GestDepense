import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff, User as UserIcon, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

const CURRENCIES = [
  { code: "EUR", name: "Euro" },
  { code: "USD", name: "Dollar US" },
  { code: "GBP", name: "Livre Sterling" },
  { code: "GNF", name: "Franc Guinéen" },
  { code: "XOF", name: "Franc CFA" },
];

const strengthConfig = [
  { label: "Faible", color: "bg-red-500", min: 0 },
  { label: "Moyen", color: "bg-yellow-500", min: 2 },
  { label: "Fort", color: "bg-green-500", min: 4 },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const level = score <= 1 ? 0 : score <= 3 ? 1 : 2;
  const config = strengthConfig[level];

  const widths = ["w-1/3", "w-2/3", "w-full"];
  return { score, label: config!.label, color: config!.color, width: widths[level]! };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterForm>();

  const password = watch("password");
  const strength = getPasswordStrength(password || "");

  const onSubmit = async (data: RegisterForm) => {
    if (!acceptedTerms) {
      setServerError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    setServerError("");
    try {
      const res = await authService.register({ ...data, currency_code: currency });
      setAuth(res.user, res.access_token);
      navigate("/", { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || "Une erreur est survenue.";
      setServerError(msg);
    }
  };

  return (
    <AuthLayout
      title="Inscription"
      subtitle="Créez votre compte GestDepense"
      icon={<UserPlus className="w-6 h-6" />}
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
          <label className="text-sm font-medium text-[var(--foreground)]">Nom complet</label>
          <div className="relative group">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
            <Input
              type="text"
              placeholder="Jean Dupont"
              className="pl-10 h-11 bg-[var(--secondary)]/50 border-[var(--input)] focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              {...register("name", { required: "Le nom est requis" })}
            />
          </div>
          {errors.name && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[var(--destructive)]">
              {errors.name.message}
            </motion.p>
          )}
        </div>

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
              placeholder="Minimum 8 caractères"
              className="pl-10 pr-10 h-11 bg-[var(--secondary)]/50 border-[var(--input)] focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              {...register("password", {
                required: "Le mot de passe est requis",
                minLength: { value: 8, message: "Minimum 8 caractères" },
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
          {password && password.length > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  className={`h-full rounded-full ${strength.color} transition-all`}
                />
              </div>
              <p className={`text-[11px] ${strength.score <= 1 ? "text-red-500" : strength.score <= 3 ? "text-yellow-500" : "text-green-500"}`}>
                Sécurité : {strength.label}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Confirmer le mot de passe</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
            <Input
              type="password"
              placeholder="Répétez le mot de passe"
              className="pl-10 h-11 bg-[var(--secondary)]/50 border-[var(--input)] focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
              {...register("password_confirmation", {
                required: "Confirmez le mot de passe",
                validate: (value) => value === password || "Les mots de passe ne correspondent pas",
              })}
            />
          </div>
          {errors.password_confirmation && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-[var(--destructive)]">
              {errors.password_confirmation.message}
            </motion.p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Devise par défaut</label>
          <div className="relative group">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--secondary)]/50 px-3 py-2 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:bg-[var(--card)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-foreground)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)]/20 cursor-pointer"
          />
          <span className="text-sm text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
            J'accepte les{" "}
            <a href="#" className="text-[var(--primary)] hover:underline">conditions d'utilisation</a>
            {" "}et la{" "}
            <a href="#" className="text-[var(--primary)] hover:underline">politique de confidentialité</a>
          </span>
        </label>

        <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-shadow">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Inscription...
            </span>
          ) : (
            "Créer mon compte"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
        Déjà un compte ?{" "}
        <Link to="/connexion" className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold transition-colors">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
