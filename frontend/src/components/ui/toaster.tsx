import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/stores/toastStore'
import { cn } from '@/lib/utils'

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />,
  error: <AlertCircle className="w-4.5 h-4.5 text-red-500" />,
  info: <Info className="w-4.5 h-4.5 text-indigo-500" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3.5 shadow-lg',
              'bg-[var(--card)] border-[var(--border)]',
            )}
          >
            <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <p className="flex-1 text-sm text-[var(--foreground)] break-words">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
