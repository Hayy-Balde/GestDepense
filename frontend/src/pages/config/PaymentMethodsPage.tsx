import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const PAYMENT_METHOD_FIELDS = [
  { key: 'value', label: 'Valeur', type: 'text' as const, required: true, placeholder: 'Ex: cash', help: 'Identifiant unique utilisé en base de données.' },
  { key: 'label', label: 'Libellé', type: 'text' as const, required: true, placeholder: 'Ex: Espèces' },
  { key: 'icon', label: 'Icône', type: 'text' as const, placeholder: 'Ex: banknote' },
  { key: 'sort_order', label: 'Ordre', type: 'number' as const },
  { key: 'is_active', label: 'Actif', type: 'boolean' as const },
]

export default function PaymentMethodsPage() {
  return (
    <ConfigItemsPage
      title="Méthodes de Paiement"
      description="Gérez les méthodes de paiement disponibles pour vos dépenses."
      endpoint="/config/payment-methods"
      icon="credit-card"
      primaryKey="value"
      fields={PAYMENT_METHOD_FIELDS}
      displayKey="label"
    />
  )
}
