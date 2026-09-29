import {
  Banknote,
  Bitcoin,
  Box,
  Briefcase,
  Building2,
  Car,
  CircleHelp,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  Heart,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Tags,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Utensils,
  Wallet,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  'building-2': Building2,
  banknote: Banknote,
  smartphone: Smartphone,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'credit-card': CreditCard,
  utensils: Utensils,
  car: Car,
  home: Home,
  heart: Heart,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  users: Users,
  'more-horizontal': MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  gift: Gift,
  'trending-up': TrendingUp,
  bitcoin: Bitcoin,
  tags: Tags,
  'refresh-cw': RefreshCw,
  'hand-coins': HandCoins,
  box: Box,
  plane: Plane,
  target: Target,
  trophy: Trophy,
}

export const ICON_EMOJI: Record<string, string> = {
  'building-2': '🏦',
  banknote: '💵',
  smartphone: '📱',
  wallet: '👛',
  bitcoin: '₿',
  'piggy-bank': '🐷',
  'credit-card': '💳',
  utensils: '🍴',
  car: '🚗',
  home: '🏠',
  heart: '❤️',
  'graduation-cap': '🎓',
  'gamepad-2': '🎮',
  'shopping-bag': '🛍️',
  receipt: '🧾',
  users: '👥',
  'more-horizontal': '📦',
  briefcase: '💼',
  laptop: '💻',
  gift: '🎁',
  'trending-up': '📈',
  tags: '🏷️',
  'refresh-cw': '🔄',
  'hand-coins': '🤝',
  box: '📦',
  plane: '✈️',
  target: '🎯',
  trophy: '🏆',
}

/** Anciennes valeurs en base qui ne suivent aucune convention. */
const LEGACY_ALIASES: Record<string, string> = {
  airplane: 'plane',
  avion: 'plane',
  flight: 'plane',
  'cash-wallet': 'wallet',
  piggy: 'piggy-bank',
  savings: 'piggy-bank',
  epargne: 'piggy-bank',
  budget: 'wallet',
  categorie: 'tags',
  category: 'tags',
}

/** Index inverse : emoji brut → clé, pour que les anciennes données rnd-trip. */
const EMOJI_TO_KEY: Map<string, string> = new Map(
  Object.entries(ICON_EMOJI).map(([key, emoji]) => [emoji, key])
)

/**
 * `Wallet` → `wallet`, `Building2` → `building-2`, `hand_coins` → `hand-coins`,
 * `🎯` → `target`. Les trois conventions historiques convergent donc vers la
 * clé kebab-case du dictionnaire.
 */
export function normalizeIconName(name?: string | null): string | null {
  if (typeof name !== 'string') return null

  const trimmed = name.trim()
  if (!trimmed) return null

  const fromEmoji = EMOJI_TO_KEY.get(trimmed)
  if (fromEmoji) return fromEmoji

  const kebab = trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])([0-9])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

  return LEGACY_ALIASES[kebab] ?? kebab
}

export function hasIcon(name?: string | null): boolean {
  const key = normalizeIconName(name)
  return !!key && key in ICON_MAP
}

export function resolveIcon(name?: string | null): LucideIcon {
  const key = normalizeIconName(name)
  if (key && ICON_MAP[key]) return ICON_MAP[key]
  return CircleHelp
}

export function iconEmoji(name?: string | null): string {
  if (typeof name === 'string') {
    const trimmed = name.trim()
    if (EMOJI_TO_KEY.has(trimmed)) return trimmed
  }

  const key = normalizeIconName(name)
  if (key && ICON_EMOJI[key]) return ICON_EMOJI[key]

  return '📁'
}
