import { useEffect, useState } from 'react'
import { expenseService, accountService, categoryService } from '../../services/api'
import { Expense } from '../../types/expense'
import { Account } from '../../types/account'
import { Category } from '../../types/index'
import { 
  Search, 
  Trash2, 
  Calendar, 
  CreditCard, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  FilterX, 
  Loader2,
  TrendingDown
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationMeta, setPaginationMeta] = useState<any>(null)
  
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load Categories & Accounts for Filters
  useEffect(() => {
    Promise.all([categoryService.getAll(), accountService.getAll()])
      .then(([catsRes, accsRes]) => {
        const cats = catsRes.data.data ? catsRes.data.data : catsRes.data
        const accs = accsRes.data.data ? accsRes.data.data : accsRes.data
        setCategories(cats.filter((c: Category) => c.type === 'expense'))
        setAccounts(accs)
      })
      .catch(err => console.error('Error loading filter options:', err))
  }, [])

  // Fetch Expenses with filters and page
  const fetchExpenses = () => {
    setLoading(true)
    const params: Record<string, any> = {
      page: currentPage
    }
    if (selectedCategory) params.category_id = selectedCategory
    if (selectedAccount) params.account_id = selectedAccount

    expenseService.getAll(params)
      .then(res => {
        const data = res.data.data ? res.data.data : res.data
        if (res.data.data && Array.isArray(res.data.data)) {
          setExpenses(res.data.data)
          setPaginationMeta({
            current_page: res.data.current_page,
            last_page: res.data.last_page,
            total: res.data.total,
            from: res.data.from,
            to: res.data.to
          })
        } else if (Array.isArray(res.data)) {
          setExpenses(res.data)
          setPaginationMeta(null)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading expenses:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchExpenses()
  }, [selectedCategory, selectedAccount, currentPage])

  // Handle transaction delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return
    setDeletingId(id)
    try {
      await expenseService.delete(id)
      fetchExpenses() // reload list
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert('Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('')
    setSelectedAccount('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Reactive client-side search on title or description
  const filteredExpenses = expenses.filter(expense => {
    const titleMatch = expense.title.toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    return titleMatch || descMatch
  })

  // Format payment method text
  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      credit_card: '💳 Carte',
      cash: '💵 Espèces',
      bank_transfer: '🏦 Virement',
      mobile_money: '📱 Mobile',
      check: '✍️ Chèque',
      other: '❓ Autre'
    }
    return methods[method] || method
  }

  // Render Skeleton rows for premium loading effect
  const renderSkeletons = () => (
    <div className="space-y-3.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 shimmer">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-800" />
            <div className="space-y-2">
              <div className="w-32 h-4 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="w-20 h-3 rounded bg-gray-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-6 rounded-full bg-gray-200 dark:bg-zinc-800" />
            <div className="w-16 h-4 rounded bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Dynamic Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">🏦 Tous les comptes</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">📁 Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || selectedAccount || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Expense Table Card */}
      {loading ? (
        renderSkeletons()
      ) : (
        <Card className="overflow-hidden border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Détails / Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Catégorie</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Moyen de paiement</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Compte</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Montant</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredExpenses.map((expense) => {
                    const categoryColor = expense.category?.color || '#6366f1'
                    return (
                      <tr 
                        key={expense.id} 
                        className="group hover:bg-[var(--muted)]/10 transition-colors duration-200"
                      >
                        {/* Title & Description & Date */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3.5">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                              <TrendingDown className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--foreground)]">{expense.title}</div>
                              <div className="flex items-center space-x-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
                                <span>{new Date(expense.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                {expense.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[180px]">{expense.description}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category Badges with dynamic HSL matching */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                            style={{ 
                              color: categoryColor, 
                              borderColor: `${categoryColor}30`, 
                              backgroundColor: `${categoryColor}12` 
                            }}
                          >
                            <span className="mr-1.5">{expense.category?.icon || '📁'}</span>
                            {expense.category?.name || 'Général'}
                          </span>
                        </td>

                        {/* Payment Method */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-[var(--foreground)] bg-[var(--muted)]/50 px-2 py-1 rounded-md border border-[var(--border)]">
                            {formatPaymentMethod(expense.payment_method)}
                          </span>
                        </td>

                        {/* Account Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                            {expense.account?.name || 'Sans compte'}
                          </span>
                        </td>

                        {/* Currency Formatting (Right-Aligned, Bold Red) */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-500 dark:text-red-400">
                          -{Number(expense.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {expense.currency_code}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            className="text-[var(--muted-foreground)] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 cursor-pointer inline-flex items-center justify-center"
                            title="Supprimer la dépense"
                          >
                            {deletingId === expense.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 bg-[var(--muted)]/30 rounded-full text-[var(--muted-foreground)]">
                            <Search className="w-6 h-6" />
                          </div>
                          <h4 className="font-semibold text-sm">Aucune dépense trouvée</h4>
                          <p className="text-xs text-[var(--muted-foreground)] max-w-xs">
                            Essayez de modifier vos termes de recherche ou réinitialisez vos filtres actifs.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Laravel Pagination Control Bar */}
            {paginationMeta && paginationMeta.last_page > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/10 text-sm">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Affichage de <span className="font-bold text-[var(--foreground)]">{paginationMeta.from || 0}</span> à <span className="font-bold text-[var(--foreground)]">{paginationMeta.to || 0}</span> sur <span className="font-bold text-[var(--foreground)]">{paginationMeta.total}</span> dépense(s)
                </span>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-3">
                    Page {currentPage} sur {paginationMeta.last_page}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginationMeta.last_page))}
                    disabled={currentPage === paginationMeta.last_page}
                    className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
