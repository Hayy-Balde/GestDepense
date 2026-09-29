import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const ACCOUNT_TYPE_FIELDS = [
  { key: 'value', label: 'Valeur', type: 'text' as const, required: true, placeholder: 'Ex: bank', help: 'Identifiant unique utilisé en base de données.' },
  { key: 'label', label: 'Libellé', type: 'text' as const, required: true, placeholder: 'Ex: Compte Bancaire' },
  { key: 'icon', label: 'Icône', type: 'text' as const, placeholder: 'Ex: building-2', help: 'Nom de l’icône Lucide (building-2, banknote, smartphone…).' },
  { key: 'color', label: 'Couleur', type: 'color' as const },
  { key: 'sort_order', label: 'Ordre', type: 'number' as const },
  { key: 'is_active', label: 'Actif', type: 'boolean' as const },
]

export default function AccountTypesPage() {
  return (
    <ConfigItemsPage
      title="Types de Comptes"
      description="Gérez les types de comptes proposés lors de la création d'un compte."
      endpoint="/config/account-types"
      icon="building-2"
      primaryKey="value"
      fields={ACCOUNT_TYPE_FIELDS}
      displayKey="label"
    />
  )
}
