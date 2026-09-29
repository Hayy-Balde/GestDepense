import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Calculator, Plus, X,
  Wallet, FolderOpen, History, ArrowRightLeft, FileSpreadsheet, PiggyBank,
  RefreshCw, HandCoins, Receipt, BarChart3, Settings, Lock, LogOut, Settings2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { lockSession } from '@/lib/lockSession'

const primaryItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/depenses', label: 'Dépenses', icon: ArrowDownCircle },
  { path: '/revenus', label: 'Revenus', icon: ArrowUpCircle },
  { path: '/budgets', label: 'Budgets', icon: Calculator },
]

const extraItems = [
  { path: '/comptes', label: 'Comptes', icon: Wallet },
  { path: '/caisses', label: 'Caisses', icon: FolderOpen },
  { path: '/mouvements', label: 'Mouvements', icon: History },
  { path: '/migration', label: 'Migration', icon: ArrowRightLeft },
  { path: '/rapports', label: 'Rapports', icon: FileSpreadsheet },
  { path: '/epargnes', label: 'Épargnes', icon: PiggyBank },
  { path: '/abonnements', label: 'Abonnements', icon: RefreshCw },
  { path: '/dettes', label: 'Dettes', icon: HandCoins },
  { path: '/factures', label: 'Factures', icon: Receipt },
  { path: '/analytiques', label: 'Analytiques', icon: BarChart3 },
  { path: '/configuration', label: 'Configuration', icon: Settings },
  { path: '/parametres', label: 'Paramètres', icon: Settings2 },
]

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [plusOpen, setPlusOpen] = useState(false)

  const handleLogout = () => {
    setPlusOpen(false)
    logout()
  }

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path))

  return (
    <>
      {/* Bottom sheet "Plus" */}
      {plusOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPlusOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-[var(--card)] rounded-t-2xl border-t border-[var(--border)] shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <p className="text-sm font-bold text-[var(--foreground)]">Plus</p>
              <button
                onClick={() => setPlusOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 pt-3 pb-2 grid grid-cols-3 gap-2">
              {extraItems.map((item) => {
                const active = isActive(item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => { setPlusOpen(false); navigate(item.path) }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-colors text-center',
                      active
                        ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)]',
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mx-3 my-2 h-px bg-[var(--border)]" />

            <div className="px-3 pb-5 space-y-1">
              <button
                onClick={() => { setPlusOpen(false); lockSession() }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
              >
                <Lock className="w-4 h-4" />
                Verrouiller la session
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryItems.map((item) => {
            const active = isActive(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                  active
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                <item.icon className={cn('w-5 h-5', active && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[var(--primary)]" />
                )}
              </NavLink>
            )
          })}

          <button
            onClick={() => setPlusOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
              'text-[var(--muted-foreground)]',
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>
    </>
  )
}
