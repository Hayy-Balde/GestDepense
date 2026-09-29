import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bug, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
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
          className="relative mx-auto w-24 h-24 flex items-center justify-center mb-8"
        >
          <div className="absolute inset-0 rounded-3xl bg-sky-500/10 animate-pulse" />
          <div className="relative flex items-center justify-center">
            <span className="text-6xl font-black text-sky-500/80 tracking-tight">404</span>
          </div>
        </motion.div>

        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-3">
            Page introuvable
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] mb-3 flex items-center justify-center gap-2">
            <Bug className="w-7 h-7 text-sky-500" />
            Cette page s'est perdue
          </h1>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            La page que vous cherchez a été déplacée ou n'existe plus.
            Vérifiez l'adresse dans la barre de navigation ou revenez à l'accueil.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <Link
            to="/depenses"
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all hover:shadow-md hover:border-sky-400/60"
          >
            <Search className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
            Explorer les dépenses
          </Link>
        </div>
      </motion.div>
    </div>
  );
}