import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/services/auth";

interface ForgotForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setServerError("");
    try {
      await authService.forgotPassword(data);
      setSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.email?.[0]
        || "Une erreur est survenue.";
      setServerError(msg);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
            <div className="w-14 h-14 rounded-xl bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Email envoyé !</h1>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation par email.
            </p>
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Recevez un lien de réinitialisation"
      icon={<Send className="w-6 h-6" />}
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
          Saisissez l'adresse email associée à votre compte. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

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

        <Button type="submit" disabled={isSubmitting} className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-shadow">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Envoi...
            </span>
          ) : (
            "Envoyer le lien"
          )}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link
          to="/connexion"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}
