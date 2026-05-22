import { useState } from 'react'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseForm from '../components/expenses/ExpenseForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { Plus, TrendingDown } from 'lucide-react'

export default function ExpensesPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Dépenses</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gérez et analysez toutes vos sorties d'argent au même endroit.
          </p>
        </div>
        
        {/* Create Button */}
        <button 
          onClick={() => setShowForm(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-600 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* Creation Overlay Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <span>💸 Ajouter une nouvelle dépense</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remplissez les détails ci-dessous pour enregistrer la transaction. Votre solde sera actualisé automatiquement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2">
            <ExpenseForm 
              onSuccess={handleSuccess} 
              onCancel={() => setShowForm(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic Filtered List Table */}
      <ExpenseList key={refreshKey} />
    </div>
  )
}
