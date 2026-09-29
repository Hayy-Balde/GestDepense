import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  CreditCard,
  RefreshCw,
  HandCoins,
  Bitcoin,
  Tags,
  Settings2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'

const CONFIG_ITEMS = [
  { path: '/configuration/types-de-comptes', label: 'Types de Comptes', description: 'Bank, cash, mobile money…', icon: Building2, color: '#4F46E5' },
  { path: '/configuration/methodes-de-paiement', label: 'Méthodes de Paiement', description: 'Espèces, virement, carte…', icon: CreditCard, color: '#0EA5E9' },
  { path: '/configuration/cycles-de-facturation', label: 'Cycles de Facturation', description: 'Hebdo, mensuel, trimestriel…', icon: RefreshCw, color: '#10B981' },
  { path: '/configuration/types-de-dette', label: 'Types de Dettes', description: 'Prêté ou emprunté', icon: HandCoins, color: '#F59E0B' },
  { path: '/configuration/devises', label: 'Devises', description: 'GNF, EUR, USD, XOF…', icon: Bitcoin, color: '#F97316' },
  { path: '/configuration/categories', label: 'Catégories', description: 'Dépenses et revenus', icon: Tags, color: '#EC4899' },
]

export default function ConfigIndexPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col justify-between items-start gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Settings2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Configuration
            </h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gérez les tables de configuration de l'application : types, méthodes, devises et catégories.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {CONFIG_ITEMS.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Link to={item.path} className="block group">
              <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5">
                <CardHeader>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className={cn('text-base font-semibold')}>{item.label}</CardTitle>
                  <CardDescription className="text-xs">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs font-medium text-[var(--primary)]">Gérer →</span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
