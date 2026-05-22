import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowDownCircle, Wallet, Calculator, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/depenses', label: 'Dépenses', icon: ArrowDownCircle },
  { path: '/comptes', label: 'Comptes', icon: Wallet },
  { path: '/budgets', label: 'Budgets', icon: Calculator },
  { path: '/plus', label: 'Plus', icon: MoreHorizontal },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && item.path !== '/plus' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path === '/plus' ? '/parametres' : item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
