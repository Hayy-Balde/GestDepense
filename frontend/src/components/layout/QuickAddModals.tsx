import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import ExpenseForm from '../expenses/ExpenseForm'
import IncomeForm from '../incomes/IncomeForm'
import { useQuickAddStore } from '../../stores/quickAddStore'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function QuickAddModals() {
  const { expenseOpen, incomeOpen, closeExpense, closeIncome } = useQuickAddStore()

  return (
    <>
      <Dialog open={expenseOpen} onOpenChange={closeExpense}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-red-500/10 text-red-500"><TrendingDown className="w-4 h-4" /></span>
              <span>Ajouter une dépense</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remplissez les détails ci-dessous pour enregistrer la transaction.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm onSuccess={closeExpense} onCancel={closeExpense} />
        </DialogContent>
      </Dialog>

      <Dialog open={incomeOpen} onOpenChange={closeIncome}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-green-500/10 text-green-500"><TrendingUp className="w-4 h-4" /></span>
              <span>Ajouter un revenu</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remplissez les détails ci-dessous pour enregistrer une entrée d'argent.
            </DialogDescription>
          </DialogHeader>
          <IncomeForm onSuccess={closeIncome} onCancel={closeIncome} />
        </DialogContent>
      </Dialog>
    </>
  )
}