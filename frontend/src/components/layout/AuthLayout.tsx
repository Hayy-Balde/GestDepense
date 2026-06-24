import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function AuthLayout({ children, title, subtitle, icon }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[var(--background)]">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[var(--primary)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[var(--accent)]/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--primary)]/3 blur-3xl" />
      </div>

      {/* Left brand panel (hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 min-h-screen items-center justify-center relative">
        <div className="max-w-md px-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/20">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-[var(--foreground)]">GestDepense</span>
            </div>

            <h2 className="text-3xl font-bold text-[var(--foreground)] leading-tight mb-4">
              Gérez vos finances{" "}
              <span className="text-gradient">personnelles</span>
            </h2>
            <p className="text-base text-[var(--muted-foreground)] leading-relaxed mb-10">
              Suivez vos dépenses, épargnez intelligemment et atteignez vos objectifs
              financiers avec une application moderne et intuitive.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                { label: "Suivi des dépenses en temps réel", desc: "Catégorisez et analysez chaque transaction" },
                { label: "Budgets et objectifs", desc: "Fixez des limites et suivez votre progression" },
                { label: "Multi-comptes et devises", desc: "Gérez plusieurs comptes et devises" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{feature.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 p-5 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)]"
            >
              <p className="text-sm text-[var(--muted-foreground)] italic">
                "Enfin une application qui me permet de voir clairement où va mon argent.
                L'interface est magnifique et super intuitive."
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--primary)]">
                  S
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--foreground)]">Sophie M.</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Utilisatrice depuis 3 mois</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--primary)]">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--foreground)]">GestDepense</span>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg shadow-black/5 p-8 relative overflow-hidden">
            {/* Card top accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-3">
                <div className="text-[var(--primary)]">{icon}</div>
              </div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{subtitle}</p>
            </div>

            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
