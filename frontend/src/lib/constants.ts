import {
  Banknote,
  Building2,
  Smartphone,
  Wallet,
  Bitcoin,
  PiggyBank,
  CreditCard,
  Utensils,
  Car,
  Home,
  Heart,
  GraduationCap,
  Gamepad2,
  ShoppingBag,
  Receipt,
  Users,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Gift,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

/* ============================================
   Account Types
   ============================================ */

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Compte Bancaire', icon: Building2, color: '#4F46E5' },
  { value: 'cash', label: 'Espèces', icon: Banknote, color: '#16A34A' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, color: '#F59E0B' },
  { value: 'wallet', label: 'Portefeuille', icon: Wallet, color: '#8B5CF6' },
  { value: 'crypto', label: 'Crypto', icon: Bitcoin, color: '#F97316' },
  { value: 'savings', label: 'Épargne', icon: PiggyBank, color: '#EC4899' },
  { value: 'credit_card', label: 'Carte de Crédit', icon: CreditCard, color: '#0EA5E9' },
] as const

/* ============================================
   Payment Methods
   ============================================ */

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement Bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'credit_card', label: 'Carte de Crédit' },
  { value: 'debit_card', label: 'Carte de Débit' },
  { value: 'check', label: 'Chèque' },
  { value: 'other', label: 'Autre' },
] as const

/* ============================================
   Expense Categories
   ============================================ */

export interface CategoryConfig {
  name: string
  icon: LucideIcon
  color: string
  gradient: string
}

export const EXPENSE_CATEGORIES: Record<string, CategoryConfig> = {
  alimentation: { name: 'Alimentation', icon: Utensils, color: '#F97316', gradient: 'from-orange-400 to-orange-600' },
  transport: { name: 'Transport', icon: Car, color: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
  logement: { name: 'Logement', icon: Home, color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  sante: { name: 'Santé', icon: Heart, color: '#EF4444', gradient: 'from-red-400 to-red-600' },
  education: { name: 'Éducation', icon: GraduationCap, color: '#06B6D4', gradient: 'from-cyan-400 to-cyan-600' },
  loisirs: { name: 'Loisirs', icon: Gamepad2, color: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  shopping: { name: 'Shopping', icon: ShoppingBag, color: '#A855F7', gradient: 'from-purple-400 to-purple-600' },
  factures: { name: 'Factures', icon: Receipt, color: '#F59E0B', gradient: 'from-amber-400 to-amber-600' },
  famille: { name: 'Famille', icon: Users, color: '#10B981', gradient: 'from-emerald-400 to-emerald-600' },
  autre: { name: 'Autre', icon: MoreHorizontal, color: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
}

export const INCOME_CATEGORIES: Record<string, CategoryConfig> = {
  salaire: { name: 'Salaire', icon: Briefcase, color: '#16A34A', gradient: 'from-green-500 to-green-700' },
  business: { name: 'Business', icon: Building2, color: '#4F46E5', gradient: 'from-indigo-400 to-indigo-600' },
  freelance: { name: 'Freelance', icon: Laptop, color: '#0EA5E9', gradient: 'from-sky-400 to-sky-600' },
  investissement: { name: 'Investissement', icon: TrendingUp, color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  cadeau: { name: 'Cadeau', icon: Gift, color: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  autre: { name: 'Autre', icon: MoreHorizontal, color: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
}

/* ============================================
   Currencies
   ============================================ */

export const CURRENCIES = [
  { code: 'GNF', name: 'Franc Guinéen', symbol: 'FG', flag: '🇬🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'USD', name: 'Dollar US', symbol: '$', flag: '🇺🇸' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£', flag: '🇬🇧' },
  { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA', flag: '🏦' },
] as const

/* ============================================
   Months
   ============================================ */

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
] as const

/* ============================================
   Billing Cycles
   ============================================ */

export const BILLING_CYCLES = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'yearly', label: 'Annuel' },
] as const

/* ============================================
   Debt Types
   ============================================ */

export const DEBT_TYPES = [
  { value: 'lent', label: 'Prêté' },
  { value: 'borrowed', label: 'Emprunté' },
] as const

/* ============================================
   Chart Colors
   ============================================ */

export const CHART_COLORS = [
  'hsl(230, 80%, 60%)',
  'hsl(160, 70%, 50%)',
  'hsl(270, 70%, 60%)',
  'hsl(35, 90%, 55%)',
  'hsl(340, 75%, 55%)',
  'hsl(190, 80%, 50%)',
  'hsl(130, 60%, 45%)',
  'hsl(15, 85%, 55%)',
  'hsl(300, 65%, 55%)',
  'hsl(60, 75%, 45%)',
]

/* ============================================
   Navigation Items
   ============================================ */

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', section: 'main' },
  { path: '/depenses', label: 'Dépenses', section: 'main' },
  { path: '/revenus', label: 'Revenus', section: 'main' },
  { path: '/comptes', label: 'Comptes', section: 'main' },
  { path: '/caisses', label: 'Caisses', section: 'finance' },
  { path: '/epargnes', label: 'Épargnes', section: 'finance' },
  { path: '/budgets', label: 'Budgets', section: 'finance' },
  { path: '/abonnements', label: 'Abonnements', section: 'other' },
  { path: '/dettes', label: 'Dettes', section: 'other' },
  { path: '/analytiques', label: 'Analytiques', section: 'other' },
  { path: '/parametres', label: 'Paramètres', section: 'settings' },
] as const
