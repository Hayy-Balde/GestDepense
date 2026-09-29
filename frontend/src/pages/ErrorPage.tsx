import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw, ShieldAlert, Bug } from 'lucide-react';

function getErrorContent(status?: number) {
  switch (status) {
    case 401:
      return {
        icon: ShieldAlert,
        title: 'Session expirée',
        message: 'Votre session a expiré ou vous n\'êtes pas autorisé à accéder à cette page. Connectez-vous à nouveau pour continuer.',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        ring: 'group-hover:border-amber-400/60',
      };
    case 403:
      return {
        icon: ShieldAlert,
        title: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        ring: 'group-hover:border-red-400/60',
      };
    case 404:
      return {
        icon: Bug,
        title: 'Page introuvable',
        message: 'La page que vous cherchez a été déplacée ou n\'existe plus. Vérifiez l\'URL ou revenez à l\'accueil.',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10',
        ring: 'group-hover:border-sky-400/60',
      };
    default:
      return {
        icon: AlertTriangle,
        title: 'Une erreur est survenue',
        message: 'Un problème inattendu est survenu. Veuillez réessayer dans un instant ou revenir à l\'accueil.',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        ring: 'group-hover:border-indigo-400/60',
      };
  }
}

export default function ErrorPage() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  const content = getErrorContent(status);

  const Icon = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={`mx-auto w-20 h-20 rounded-3xl ${content.bg} flex items-center justify-center mb-8 shadow-lg`}
        >
          <Icon className={`w-10 h-10 ${content.color}`} />
        </motion.div>

        <div className="mb-8">
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${content.color} mb-3`}>
            {status ? `Erreur ${status}` : 'Oups'}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--foreground)] mb-3">
            {content.title}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {content.message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className={`group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all hover:shadow-md ${content.ring}`}
          >
            <Home className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
            Retour à l'accueil
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            Réessayer
          </button>
        </div>
      </motion.div>
    </div>
  );
}