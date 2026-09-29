import { useState } from 'react'
import { AlertTriangle, Check, Copy, Home, RefreshCw } from 'lucide-react'
import { cn } from '../lib/utils'

interface ErrorFallbackProps {
  statusCode?: number
  title: string
  message?: string
  errorStack?: string | null
  onReload: () => void
  onHome?: () => void
}

export function ErrorFallback({ statusCode, title, message, errorStack, onReload, onHome }: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false)

  const stacktrace = errorStack?.trim() ?? null

  const handleCopy = async () => {
    if (!stacktrace) return
    try {
      await navigator.clipboard.writeText(stacktrace)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard non disponible */
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] relative overflow-hidden">
      <div className="gradient-mesh absolute inset-0 pointer-events-none" />

      <div className="relative w-full max-w-lg animate-fade-in">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-card p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--destructive-bg)] border border-[var(--destructive-border)] mb-5">
              <AlertTriangle className="w-7 h-7 text-[var(--destructive)]" />
            </div>

            <h1 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-2 leading-relaxed">
              {message ?? 'Une erreur inattendue est survenue.'}
            </p>

            {typeof statusCode === 'number' && (
              <span className="mt-3 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                Erreur {statusCode}
              </span>
            )}
          </div>

          {stacktrace && (
            <details className="group mt-6 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40">
              <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--muted-foreground)] cursor-pointer select-none group-open:border-b group-open:border-[var(--border)] transition-colors hover:text-[var(--foreground)]">
                <span>Détails techniques (stack trace)</span>
                <span className="text-xs text-[var(--muted-foreground)] group-open:hidden">Afficher</span>
                <span className="text-xs text-[var(--muted-foreground)] hidden group-open:inline">Masquer</span>
              </summary>
              <div className="relative p-4">
                <pre className="max-h-56 overflow-auto rounded-lg bg-[var(--background)] border border-[var(--border)] p-3 text-[11px] leading-relaxed font-mono text-[var(--foreground)] whitespace-pre-wrap break-words">
                  {stacktrace}
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    'absolute top-6 right-6 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer',
                    copied
                      ? 'border-[var(--success)] text-[var(--success)] bg-[var(--success-bg)]'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--input)]'
                  )}
                  aria-label="Copier la trace d'erreur"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiée' : 'Copier'}
                </button>
              </div>
            </details>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-primary-700 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recharger la page
            </button>
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
          Si le problème persiste, essayez de recharger ou contactez le support.
        </p>
      </div>
    </div>
  )
}
