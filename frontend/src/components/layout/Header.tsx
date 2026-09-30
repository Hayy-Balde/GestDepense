import { ChevronLeft, ChevronRight, Search, Bell, Sun, Moon, Menu, CalendarDays, Check, Plus, TrendingDown, TrendingUp, X, Wallet, PiggyBank, AlertTriangle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useMonthStore } from '@/stores/monthStore'
import { useUIStore } from '@/stores/uiStore'
import { useQuickAddStore } from '@/stores/quickAddStore'
import { searchService, notificationService } from '@/services/api'
import { useToastStore, getApiErrorMessage } from '@/stores/toastStore'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import type { SearchResult, AppNotification } from '@/types'
import { MONTHS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EMPTY_RESULTS: SearchResult = { expenses: [], incomes: [], accounts: [], caisses: [] }

function notifTitle(n: AppNotification): string {
  const title = n.data?.title
  if (typeof title === 'string' && title) return title
  const type = String(n.type || '').split('\\').pop() || 'Notification'
  return type.replace(/([A-Z])/g, ' $1').trim()
}

function notifMessage(n: AppNotification): string {
  const msg = n.data?.message ?? n.data?.body
  if (typeof msg === 'string' && msg) return msg
  return n.data?.action_text ? String(n.data.action_text) : 'Nouvelle notification'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  return `il y a ${d} j`
}

export function Header() {
  const { currentMonth, currentYear, goNext, goPrev, goToToday } = useMonthStore()
  const { theme, setTheme, setMobileMenuOpen } = useUIStore()
  const { openExpense, openIncome } = useQuickAddStore()
  const navigate = useNavigate()
  const { error: toastError } = useToastStore()
  const { setUser } = useAuthStore()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>(EMPTY_RESULTS)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<AppNotification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Fermer les panneaux au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Recherche debouncée
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(EMPTY_RESULTS)
      setSearchOpen(false)
      return
    }
    setSearchLoading(true)
    const t = setTimeout(() => {
      searchService
        .global({ q: query.trim(), month: currentMonth, year: currentYear })
        .then((res) => {
          setResults(res.data || EMPTY_RESULTS)
          setSearchOpen(true)
        })
        .catch(() => {
          setResults(EMPTY_RESULTS)
          setSearchOpen(false)
        })
        .finally(() => setSearchLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query, currentMonth, currentYear])

  const loadNotifications = () => {
    if (notifLoading) return
    setNotifLoading(true)
    notificationService
      .getAll()
      .then((res) => setNotifs(res.data || []))
      .catch((err) => toastError(getApiErrorMessage(err, 'Impossible de charger les notifications.')))
      .finally(() => setNotifLoading(false))
  }

  useEffect(() => {
    if (notifOpen && notifs.length === 0) loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement à l'ouverture
  }, [notifOpen])

  const unreadCount = notifs.filter((n) => !n.read_at).length

  const markAsRead = async (n: AppNotification) => {
    if (n.read_at) return
    setMarkingId(n.id)
    try {
      await notificationService.markAsRead(n.id)
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
    } catch {
      // silencieux
    } finally {
      setMarkingId(null)
    }
  }

  const markAllRead = async () => {
    const unread = notifs.filter((n) => !n.read_at)
    await Promise.all(unread.map((n) => notificationService.markAsRead(n.id).catch(() => null)))
    setNotifs((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: new Date().toISOString() })))
  }

  const goTo = (path: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(path)
  }

  const resultCount =
    results.expenses.length + results.incomes.length + results.accounts.length + results.caisses.length

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-xl">
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
        <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1">
          <Button variant="ghost" size="icon-sm" onClick={goPrev} className="rounded-md">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={goToToday}
            className={cn(
              'flex items-center gap-1.5 rounded-md font-semibold whitespace-nowrap',
              'hover:bg-[var(--card)] transition-colors',
              'text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1.5',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
            <span className="hidden sm:inline">
              {(MONTHS[currentMonth - 1] ?? '')} {currentYear}
            </span>
            <span className="sm:hidden">
              {(MONTHS[currentMonth - 1] ?? '').slice(0, 3)} {currentYear}
            </span>
          </button>
          <Button variant="ghost" size="icon-sm" onClick={goNext} className="rounded-md">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick add */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openExpense}
            className="rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] hover:bg-[var(--destructive)]/15"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Dépense</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={openIncome}
            className="rounded-lg bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/15"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Revenu</span>
          </Button>
        </div>
        {/* Compact add (mobile) */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={openExpense}
          title="Ajouter une dépense"
          className="rounded-lg sm:hidden bg-[var(--destructive)]/10 text-[var(--destructive)]"
        >
          <TrendingDown className="w-4 h-4" />
        </Button>

        {/* Search (hidden on small screens) */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2 && resultCount > 0) setSearchOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false)
              }}
              placeholder="Rechercher..."
              className="pl-9 pr-8 w-56 h-9 bg-[var(--secondary)] border-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setSearchOpen(false)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                aria-label="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Résultats */}
          {searchOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
              {searchLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-[var(--muted-foreground)]">
                  <span className="w-4 h-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                  Recherche en cours...
                </div>
              ) : resultCount === 0 ? (
                <div className="flex flex-col items-center gap-2 p-6 text-sm text-[var(--muted-foreground)]">
                  <Search className="w-5 h-5" />
                  Aucun résultat pour « {query} »
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {results.expenses.length > 0 && (
                    <SectionTitle label="Dépenses" />
                  )}
                  {results.expenses.map((e) => (
                    <button
                      key={'e' + e.id}
                      onClick={() => goTo('/depenses')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]/50 transition-colors"
                    >
                      <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[var(--foreground)] truncate">{e.title}</span>
                        <span className="block text-xs text-[var(--muted-foreground)]">{e.date}</span>
                      </span>
                      <span className="text-sm font-semibold text-red-500 shrink-0">
                        -{Number(e.amount).toLocaleString('fr-FR')} {e.currency_code}
                      </span>
                    </button>
                  ))}

                  {results.incomes.length > 0 && <SectionTitle label="Revenus" />}
                  {results.incomes.map((i) => (
                    <button
                      key={'i' + i.id}
                      onClick={() => goTo('/revenus')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]/50 transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[var(--foreground)] truncate">{i.title}</span>
                        <span className="block text-xs text-[var(--muted-foreground)]">{i.date}</span>
                      </span>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{Number(i.amount).toLocaleString('fr-FR')} {i.currency_code}
                      </span>
                    </button>
                  ))}

                  {results.accounts.length > 0 && <SectionTitle label="Comptes" />}
                  {results.accounts.map((a) => (
                    <button
                      key={'a' + a.id}
                      onClick={() => goTo('/comptes')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]/50 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[var(--foreground)] truncate">{a.name}</span>
                        <span className="block text-xs text-[var(--muted-foreground)] capitalize">{a.type}</span>
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                        {Number(a.balance).toLocaleString('fr-FR')} {a.currency_code}
                      </span>
                    </button>
                  ))}

                  {results.caisses.length > 0 && <SectionTitle label="Caisses" />}
                  {results.caisses.map((c) => (
                    <button
                      key={'c' + c.id}
                      onClick={() => goTo('/caisses')}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--secondary)]/50 transition-colors"
                    >
                      <PiggyBank className="w-4 h-4 text-[var(--warning)] shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-[var(--foreground)] truncate">{c.name}</span>
                        <span className="block text-xs text-[var(--muted-foreground)]">
                          {c.status === 'active' ? 'Active' : 'Clôturée'}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                        {Number(c.remaining).toLocaleString('fr-FR')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={async () => {
            const next = isDark ? 'light' : 'dark'
            setTheme(next)
            try {
              const res = await api.put('/auth/preferences', { preferences: { theme: next } })
              if (res.data?.user) setUser(res.data.user)
            } catch {
              // ignore
            }
          }}
          className="rounded-lg"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative rounded-lg"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 px-1 flex items-center justify-center text-[9px]" variant="destructive">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <p className="text-sm font-bold text-[var(--foreground)]">Notifications</p>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs rounded-lg">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Tout lire
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifLoading && notifs.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-[var(--muted-foreground)]">
                    <span className="w-4 h-4 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                    Chargement...
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 p-6 text-sm text-[var(--muted-foreground)]">
                    <Inbox className="w-5 h-5" />
                    Aucune notification
                  </div>
                ) : (
                  notifs.map((n) => {
                    const unread = !n.read_at
                    return (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n)}
                        disabled={markingId === n.id}
                        className={cn(
                          'w-full flex items-start gap-3 px-4 py-3 text-left border-b border-[var(--border)] last:border-0 hover:bg-[var(--secondary)]/50 transition-colors',
                          !unread && 'opacity-60',
                        )}
                      >
                        <div
                          className={cn(
                            'p-1.5 rounded-lg shrink-0',
                            unread ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                          )}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[var(--foreground)]">{notifTitle(n)}</span>
                          <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">{notifMessage(n)}</span>
                          <span className="block text-[11px] text-[var(--muted-foreground)]/80 mt-1">{timeAgo(n.created_at)}</span>
                        </span>
                        {unread && <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function SectionTitle({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--secondary)]/30">
      {label}
    </p>
  )
}
