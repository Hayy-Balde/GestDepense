import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Wallet, FolderOpen,
  PiggyBank, Calculator, RefreshCw, HandCoins, BarChart3, Settings,
  ChevronLeft, ChevronRight, LogOut, X, ChevronDown, Building2, CreditCard,
  Bitcoin, Tags, History, ArrowRightLeft, FileSpreadsheet, Receipt, ListPlus,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'

const navItems = [
  { section: 'Principal', items: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/depenses', label: 'Dépenses', icon: ArrowDownCircle },
    { path: '/revenus', label: 'Revenus', icon: ArrowUpCircle },
    { path: '/saisie-rapide', label: 'Saisie rapide', icon: ListPlus },
    { path: '/comptes', label: 'Comptes', icon: Wallet },
  ]},
  { section: 'Finances', items: [
    { path: '/caisses', label: 'Caisses', icon: FolderOpen },
    { path: '/mouvements', label: 'Mouvements', icon: History },
    { path: '/migration', label: 'Migration', icon: ArrowRightLeft },
    { path: '/rapports', label: 'Rapports', icon: FileSpreadsheet },
    { path: '/epargnes', label: 'Épargnes', icon: PiggyBank },
    { path: '/budgets', label: 'Budgets', icon: Calculator },
  ]},
  { section: 'Autres', items: [
    { path: '/abonnements', label: 'Abonnements', icon: RefreshCw },
    { path: '/dettes', label: 'Dettes', icon: HandCoins },
    { path: '/factures', label: 'Factures', icon: Receipt },
    { path: '/analytiques', label: 'Analytiques', icon: BarChart3 },
  ]},
]

const configItems = [
  { path: '/configuration/types-de-comptes', label: 'Types de Comptes', icon: Building2 },
  { path: '/configuration/methodes-de-paiement', label: 'Méthodes de Paiement', icon: CreditCard },
  { path: '/configuration/cycles-de-facturation', label: 'Cycles de Facturation', icon: RefreshCw },
  { path: '/configuration/types-de-dette', label: 'Types de Dettes', icon: HandCoins },
  { path: '/configuration/devises', label: 'Devises', icon: Bitcoin },
  { path: '/configuration/categories', label: 'Catégories', icon: Tags },
]

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const [configOpen, setConfigOpen] = useState(() =>
    location.pathname.startsWith('/configuration'),
  )
  const configActive = configItems.some((item) => location.pathname === item.path)

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 flex flex-col border-r border-[var(--border)] bg-[var(--card)]',
          'transition-all duration-300 ease-out',
          'lg:relative lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{ width: sidebarCollapsed ? 72 : 260 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--border)]">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shadow-md">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="font-bold text-base tracking-tight">Fin-Track</span>
              <span className="text-[10px] text-[var(--muted-foreground)] -mt-0.5">Suivi de finances</span>
            </motion.div>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navItems.map((group) => (
            <div key={group.section}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  {group.section}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path))
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        'hover:bg-[var(--secondary)]',
                        isActive && 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:bg-[var(--primary)]',
                        !isActive && 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                        sidebarCollapsed && 'justify-center px-2',
                      )}
                    >
                      <item.icon className={cn('w-5 h-5 shrink-0', isActive && 'text-[var(--primary-foreground)]')} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Configuration section */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Configuration
              </h3>
            )}
            {sidebarCollapsed ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center px-3 py-2.5 rounded-xl text-[var(--muted-foreground)]">
                  <Settings className="w-5 h-5 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <NavLink
                  to="/configuration"
                  onClick={() => { setConfigOpen(!configOpen); setMobileMenuOpen(false) }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-[var(--secondary)]',
                    configActive && 'bg-[var(--secondary)]/60 text-[var(--foreground)]',
                    'text-[var(--muted-foreground)]',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-5 h-5 shrink-0" />
                    <span>Configuration</span>
                  </span>
                  <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform duration-200', configOpen && 'rotate-180')} />
                </NavLink>

                <AnimatePresence initial={false}>
                  {configOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 space-y-1 pl-4 border-l border-[var(--border)]">
                        {configItems.map((item) => {
                          const isActive = location.pathname === item.path
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                'hover:bg-[var(--secondary)]',
                                isActive && 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:bg-[var(--primary)]',
                                !isActive && 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                              )}
                            >
                              <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-[var(--primary-foreground)]')} />
                              <span>{item.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </nav>

        <Separator />

        {/* Settings link */}
        <div className="px-3 py-2">
          <NavLink
            to="/parametres"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              location.pathname === '/parametres' && 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]',
              sidebarCollapsed && 'justify-center px-2',
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Paramètres</span>}
          </NavLink>
        </div>

        {/* User section */}
        <div className={cn('p-3 border-t border-[var(--border)]', sidebarCollapsed && 'flex justify-center')}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--secondary)]/50">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={logout} title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Avatar className="h-9 w-9 cursor-pointer" onClick={logout}>
              <AvatarFallback className="text-xs">{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center',
            'rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]',
            'hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors shadow-sm',
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  )
}
