import { ConfigItemsPage } from '../../components/config/ConfigItemsPage'

const CATEGORY_FIELDS = [
  { key: 'name', label: 'Nom', type: 'text' as const, required: true, placeholder: 'Ex: Alimentation' },
  { key: 'type', label: 'Type', type: 'select' as const, required: true, options: [
    { value: 'expense', label: 'Dépense' },
    { value: 'income', label: 'Revenu' },
  ] },
  { key: 'icon', label: 'Icône', type: 'text' as const, placeholder: 'Ex: utensils', help: 'Nom de l’icône Lucide (utensils, car, home…).' },
  { key: 'color', label: 'Couleur', type: 'color' as const },
  { key: 'sort_order', label: 'Ordre', type: 'number' as const },
]

export default function CategoriesPage() {
  return (
    <ConfigItemsPage
      title="Catégories"
      description="Gérez les catégories de dépenses et de revenus."
      endpoint="/categories"
      icon="tags"
      primaryKey="id"
      fields={CATEGORY_FIELDS}
      displayKey="name"
    />
  )
}
