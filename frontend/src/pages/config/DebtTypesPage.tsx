import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const DEBT_TYPE_FIELDS = [
  { key: 'value', label: 'Valeur', type: 'text' as const, required: true, placeholder: 'Ex: lent', help: 'Identifiant unique utilisé en base de données.' },
  { key: 'label', label: 'Libellé', type: 'text' as const, required: true, placeholder: 'Ex: Prêté' },
  { key: 'sort_order', label: 'Ordre', type: 'number' as const },
  { key: 'is_active', label: 'Actif', type: 'boolean' as const },
]

export default function DebtTypesPage() {
  return (
    <ConfigItemsPage
      title="Types de Dettes"
      description="Gérez les types de dettes : prêtées ou empruntées."
      endpoint="/config/debt-types"
      icon="hand-coins"
      primaryKey="value"
      fields={DEBT_TYPE_FIELDS}
      displayKey="label"
    />
  )
}
