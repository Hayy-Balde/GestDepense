import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const verified = searchParams.get("verified") === "true";

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await api.post("/auth/email/verification-notification");
      setResent(true);
    } catch {
      setError("Impossible d'envoyer l'email. Veuillez réessayer.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />

          {verified ? (
            <div className="w-14 h-14 rounded-xl bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[var(--success)]" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7 text-[var(--primary)]" />
            </div>
          )}

          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            {verified ? "Email vérifié !" : "Vérifiez votre email"}
          </h1>

          {verified ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Votre adresse email a été vérifiée avec succès.
              </p>
              <Link
                to="/connexion"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Accéder à la connexion
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--muted-foreground)] mb-1">
                Un email de vérification a été envoyé à votre adresse.
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Cliquez sur le lien dans l'email pour activer votre compte.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-[var(--destructive-bg)] border border-[var(--destructive-border)] text-sm text-[var(--destructive)] mb-4"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {resent ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[var(--success)] mb-4 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Email renvoyé !
                </motion.p>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleResend}
                  disabled={resending}
                  className="mb-4 h-11 rounded-xl"
                >
                  {resending ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Renvoyer l'email
                    </span>
                  )}
                </Button>
              )}

              <div>
                <Link
                  to="/connexion"
                  className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
