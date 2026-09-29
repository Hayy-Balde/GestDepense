import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const BILLING_CYCLE_FIELDS = [
  { key: 'value', label: 'Valeur', type: 'text' as const, required: true, placeholder: 'Ex: monthly', help: 'Identifiant unique utilisé en base de données.' },
  { key: 'label', label: 'Libellé', type: 'text' as const, required: true, placeholder: 'Ex: Mensuel' },
  { key: 'sort_order', label: 'Ordre', type: 'number' as const },
  { key: 'is_active', label: 'Actif', type: 'boolean' as const },
]

export default function BillingCyclesPage() {
  return (
    <ConfigItemsPage
      title="Cycles de Facturation"
      description="Gérez les cycles de facturation pour vos abonnements."
      endpoint="/config/billing-cycles"
      icon="refresh-cw"
      primaryKey="value"
      fields={BILLING_CYCLE_FIELDS}
      displayKey="label"
    />
  )
}
