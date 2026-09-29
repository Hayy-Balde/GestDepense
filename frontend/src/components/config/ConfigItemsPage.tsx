import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, Settings2 } from 'lucide-react'
import { api } from '../../services/api'
import { useConfigStore } from '../../stores/configStore'
import { resolveIcon } from '../../lib/iconMap'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { ConfirmDialog } from '../../components/ui/confirm-dialog'
import { useToastStore, getApiErrorMessage } from '../../stores/toastStore'

export interface ConfigField {
  key: string
  label: string
  type: 'text' | 'color' | 'number' | 'boolean' | 'select'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  help?: string
}

export interface ConfigPageProps {
  title: string
  description: string
  endpoint: string
  icon: string
  primaryKey: string
  fields: ConfigField[]
  displayKey?: string
}

const DEFAULT_VALUES: Record<string, string | number | boolean> = {
  value: '',
  label: '',
  icon: '',
  color: '#6366F1',
  sort_order: 0,
  is_active: true,
  code: '',
  name: '',
  symbol: '',
  decimal_places: 2,
  slug: '',
  type: 'expense',
}

export function ConfigItemsPage({ title, description, endpoint, icon, primaryKey, fields, displayKey }: ConfigPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteKey, setDeleteKey] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { success, error: toastError } = useToastStore()
  const refreshConfig = useConfigStore((s) => s.refresh)

  const deletingItem = items.find((it) => it[primaryKey] === confirmDeleteId)

  const Icon = resolveIcon(icon)

  const loadData = () => {
    setLoading(true)
    setError(null)
    api
      .get(endpoint)
      .then((res) => setItems(res.data?.data || res.data || []))
      .catch(() => {
        setItems([])
        setError('Backend non connecté — impossible de charger les données.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [endpoint])

  const openCreate = () => {
    setEditing(null)
    const defaults: Record<string, unknown> = {}
    for (const f of fields) {
      defaults[f.key] = DEFAULT_VALUES[f.key] ?? ''
      if (f.type === 'boolean') defaults[f.key] = true
    }
    setForm(defaults)
    setDialogOpen(true)
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditing(item)
    const prefill: Record<string, unknown> = {}
    for (const f of fields) {
      prefill[f.key] = item[f.key] ?? DEFAULT_VALUES[f.key] ?? ''
    }
    setForm(prefill)
    setDialogOpen(true)
  }

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const id = editing ? String(editing[primaryKey]) : null
      if (id) {
        await api.put(`${endpoint}/${id}`, form)
      } else {
        await api.post(endpoint, form)
      }
      setDialogOpen(false)
      loadData()
      refreshConfig()
    } catch {
      setError('Une erreur est survenue lors de la sauvegarde.')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    setDeleteKey(id)
    try {
      const res = await api.delete(`${endpoint}/${id}`)
      success((res.data as { message?: string })?.message || 'Élément supprimé avec succès.')
      setConfirmDeleteId(null)
      setItems((prev) => prev.filter((it) => it[primaryKey] !== id))
      refreshConfig()
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Impossible de supprimer cet élément.'))
      setConfirmDeleteId(null)
    } finally {
      setDeleteKey(null)
    }
  }

  const rowLabel = (item: Record<string, unknown>) => {
    if (displayKey) return String(item[displayKey] ?? item.label ?? item.value ?? item.code ?? '')
    return String(item.label ?? item.value ?? item.code ?? item.name ?? item.slug ?? '')
  }

  const tableFields = useMemo(
    () => fields.filter((f) => f.key !== primaryKey && f.key !== 'is_active' && f.key !== 'sort_order'),
    [fields, primaryKey],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">{title}</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          Ajouter
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-[var(--muted)]/30 mb-4">
              <Settings2 className="w-10 h-10 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--foreground)]">Aucun élément</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-5">
              Ajoutez le premier élément de configuration.
            </p>
            <Button onClick={openCreate} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {title}
              </CardTitle>
              <CardDescription>{items.length} élément(s)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const id = String(item[primaryKey])
                  const active = item.is_active !== false
                  return (
                    <div key={id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: String(item.color || '#6B7280') }} />
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{rowLabel(item)}</span>
                        <Badge variant={active ? 'success' : 'secondary'}>
                          {active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-md hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(id)}
                          disabled={deleteKey === id}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {deleteKey === id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <span>{editing ? `Modifier ${title}` : `Ajouter ${title}`}</span>
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Modifiez les informations ci-dessous.' : 'Renseignez les informations ci-dessous.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 mt-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`field-${field.key}`}>{field.label}{field.required ? ' *' : ''}</Label>
                {field.type === 'boolean' ? (
                  <label className="flex items-center space-x-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      id={`field-${field.key}`}
                      checked={Boolean(form[field.key])}
                      onChange={(e) => setField(field.key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-[var(--muted-foreground)]">Actif</span>
                  </label>
                ) : field.type === 'color' ? (
                  <Input
                    id={`field-${field.key}`}
                    type="color"
                    value={String(form[field.key] ?? '#6366F1')}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="h-10 p-1 cursor-pointer"
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={`field-${field.key}`}
                    value={String(form[field.key] ?? '')}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={`field-${field.key}`}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={form[field.key] == null ? '' : String(form[field.key])}
                    onChange={(e) => setField(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
                {field.help && <p className="text-xs text-[var(--muted-foreground)]">{field.help}</p>}
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} className="cursor-pointer">
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="cursor-pointer">
                {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editing ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
        title="Supprimer cet élément ?"
        description={
          deletingItem
            ? `« ${rowLabel(deletingItem)} » sera définitivement supprimé.`
            : undefined
        }
        loading={deleteKey === confirmDeleteId}
        onConfirm={() => confirmDeleteId && onDelete(confirmDeleteId)}
      />
    </div>
  )
}
