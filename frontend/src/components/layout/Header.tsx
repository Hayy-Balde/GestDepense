import { ChevronLeft, ChevronRight, Search, Bell, Sun, Moon, Menu, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useMonthStore } from '@/stores/monthStore'
import { useUIStore } from '@/stores/uiStore'
import { MONTHS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Header() {
  const { currentMonth, currentYear, goNext, goPrev, goToToday } = useMonthStore()
  const { theme, setTheme, setMobileMenuOpen } = useUIStore()

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
      {/* Left: Mobile menu + Month selector */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Month navigation */}
        <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-xl p-1">
          <Button variant="ghost" size="icon-sm" onClick={goPrev} className="rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={goToToday}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold',
              'hover:bg-[var(--card)] transition-colors',
            )}
          >
            <CalendarDays className="w-4 h-4 text-[var(--primary)]" />
            <span>{MONTHS[currentMonth - 1]} {currentYear}</span>
          </button>
          <Button variant="ghost" size="icon-sm" onClick={goNext} className="rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search (hidden on small screens) */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Rechercher..."
            className="pl-9 w-56 h-9 bg-[var(--secondary)] border-none"
          />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="rounded-lg"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative rounded-lg">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]" variant="destructive">
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
