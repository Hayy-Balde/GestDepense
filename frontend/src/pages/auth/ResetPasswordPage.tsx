import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/services/auth";

interface ResetForm {
  password: string;
  password_confirmation: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetForm>();

  const password = watch("password");

  const onSubmit = async (data: ResetForm) => {
    setServerError("");
    try {
      await authService.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setSuccess(true);
      setTimeout(() => navigate("/connexion", { replace: true }), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || "Une erreur est survenue. Veuillez réessayer.";
      setServerError(msg);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 p-8 text-center max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--destructive)] to-[var(--warning)]" />
          <AlertCircle className="w-12 h-12 text-[var(--destructive)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Lien invalide</h1>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link
            to="/mot-de-passe-oublie"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--success)] to-[var(--primary)]" />
            <div className="w-14 h-14 rounded-xl bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Mot de passe réinitialisé !</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe sécurisé"
      icon={<KeyRound className="w-6 h-6" />}
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

        <p className="text-sm text-[var(--muted-foreground)]">
          Définissez un nouveau mot de passe pour votre compte <strong className="text-[var(--foreground)]">{email}</strong>
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Nouveau mot de passe</label>
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

        <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-shadow">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Réinitialisation...
            </span>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}
