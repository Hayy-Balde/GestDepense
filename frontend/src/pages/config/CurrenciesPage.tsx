import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const CURRENCY_FIELDS = [
  { key: 'code', label: 'Code', type: 'text' as const, required: true, placeholder: 'Ex: GNF', help: 'Code ISO 4217 sur 3 caractères.' },
  { key: 'name', label: 'Nom', type: 'text' as const, required: true, placeholder: 'Ex: Franc Guinéen' },
  { key: 'symbol', label: 'Symbole', type: 'text' as const, required: true, placeholder: 'Ex: FG' },
  { key: 'decimal_places', label: 'Décimales', type: 'number' as const },
]

export default function CurrenciesPage() {
  return (
    <ConfigItemsPage
      title="Devises"
      description="Gérez les devises disponibles dans l'application."
      endpoint="/config/currencies"
      icon="bitcoin"
      primaryKey="code"
      fields={CURRENCY_FIELDS}
      displayKey="name"
    />
  )
}
