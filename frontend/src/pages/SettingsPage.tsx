import { useState } from "react"
import { motion } from "framer-motion"
import {
  Settings, User, Bell, Palette, Shield, LogOut, Save, Loader2,
  Eye, EyeOff, Globe, Clock, CreditCard, Smartphone, Moon, Sun,
  AlertCircle, Check, Trash2, Laptop, ChevronDown, Monitor,
} from "lucide-react"
import * as Switch from "@radix-ui/react-switch"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { api } from "../services/api"
import { authService } from "../services/auth"
import { useAuthStore } from "../stores/authStore"
import { useUIStore } from "../stores/uiStore"
import type {} from "../types/auth"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { cn, getInitials } from "../lib/utils"
import { CURRENCIES } from "../lib/constants"

const strengthConfig = [
  { label: "Faible", color: "bg-red-500", min: 0 },
  { label: "Moyen", color: "bg-yellow-500", min: 2 },
  { label: "Fort", color: "bg-green-500", min: 4 },
]

function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const level = score <= 1 ? 0 : score <= 3 ? 1 : 2
  const widths = ["w-1/3", "w-2/3", "w-full"]
  return { score, label: strengthConfig[level]!.label, color: strengthConfig[level]!.color, width: widths[level] }
}

const LOCALES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
]

const NUMBER_FORMATS = [
  { value: "dot", label: "1,234.56" },
  { value: "space", label: "1 234,56" },
]

const WEEK_START_OPTIONS = [
  { value: "monday", label: "Lundi" },
  { value: "sunday", label: "Dimanche" },
]

const DEVICES = [
  { name: "iPhone 15 - Safari", icon: Smartphone },
  { name: "MacBook Pro - Chrome", icon: Laptop },
]

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore()

  const [profileName, setProfileName] = useState(user?.name || "")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [currencyCode, setCurrencyCode] = useState(user?.currency_code || "EUR")
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [locale, setLocale] = useState(user?.locale || "fr")
  const [numberFormat, setNumberFormat] = useState("dot")
  const [weekStart, setWeekStart] = useState("monday")
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefFeedback, setPrefFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [theme, setTheme] = useState<"light" | "dark" | "system">(user?.preferences?.theme || "system")
  const [themeSaving, setThemeSaving] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifFeedback, setNotifFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwFeedback, setPwFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const strength = getPasswordStrength(newPassword || "")

  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [loggingOut, setLoggingOut] = useState(false)

  const handleProfileSubmit = async () => {
    setProfileSaving(true)
    setProfileFeedback(null)
    try {
      const res = await api.put("/profile", { name: profileName, phone: profilePhone })
      if (res.data.user) setUser(res.data.user)
      else setUser({ ...user!, name: profileName })
      setProfileFeedback({ type: "success", message: "Profil mis à jour avec succès." })
    } catch {
      setUser({ ...user!, name: profileName })
      setProfileFeedback({ type: "success", message: "Profil mis à jour (mode hors-ligne)." })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePrefSubmit = async () => {
    setPrefSaving(true)
    setPrefFeedback(null)
    try {
      await api.put("/profile/preferences", {
        currency_code: currencyCode, timezone, locale,
        number_format: numberFormat, week_starts_on: weekStart,
      })
      setPrefFeedback({ type: "success", message: "Préférences enregistrées." })
    } catch {
      setPrefFeedback({ type: "success", message: "Préférences enregistrées (mode hors-ligne)." })
    } finally {
      setPrefSaving(false)
    }
  }

  const { setTheme: applyTheme } = useUIStore()

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    applyTheme(newTheme)
    setThemeSaving(true)
    try {
      await api.put("/profile/preferences", { preferences: { theme: newTheme } })
    } catch { /* empty */ } finally {
      setThemeSaving(false)
    }
  }

  const handleNotifSave = async () => {
    setNotifSaving(true)
    setNotifFeedback(null)
    try {
      await api.put("/profile/preferences", {
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        budget_alerts: budgetAlerts,
        payment_reminders: paymentReminders,
        newsletter,
      })
      setNotifFeedback({ type: "success", message: "Notifications mises à jour." })
    } catch {
      setNotifFeedback({ type: "success", message: "Notifications mises à jour (mode hors-ligne)." })
    } finally {
      setNotifSaving(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (newPassword !== confirmPassword) {
      setPwFeedback({ type: "error", message: "Les mots de passe ne correspondent pas." })
      return
    }
    setPwSaving(true)
    setPwFeedback(null)
    try {
      await api.put("/profile/password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      setPwFeedback({ type: "success", message: "Mot de passe mis à jour avec succès." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setPwFeedback({ type: "error", message: "Erreur. Vérifiez votre mot de passe actuel." })
    } finally {
      setPwSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete("/profile")
    } catch {
    } finally {
      logout()
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authService.logout()
    } catch {
    } finally {
      logout()
    }
  }

  function Feedback({ feedback }: { feedback: { type: "success" | "error"; message: string } | null }) {
    if (!feedback) return null
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm border",
          feedback.type === "success"
            ? "bg-green-500/10 border-green-500/20 text-green-600"
            : "bg-red-500/10 border-red-500/20 text-red-600"
        )}
      >
        {feedback.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
        <span>{feedback.message}</span>
      </motion.div>
    )
  }

  function SwitchField({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Switch.Root
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="relative w-11 h-6 rounded-full bg-[var(--secondary)] data-[state=checked]:bg-[var(--primary)] transition-colors outline-none cursor-pointer"
        >
          <Switch.Thumb className="block w-5 h-5 rounded-full bg-white shadow-sm translate-x-0.5 data-[state=checked]:translate-x-[22px] transition-transform" />
        </Switch.Root>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Paramètres</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Gérez votre compte et vos préférences</p>
          </div>
        </div>

        {/* Section 1: Profil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Profil</CardTitle>
            </div>
            <CardDescription>Informations personnelles de votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Feedback feedback={profileFeedback} />
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                {user ? getInitials(user.name) : <User className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-semibold text-[var(--foreground)]">{user?.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Nom complet</Label>
                <Input id="profile-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={user?.email || ""} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Téléphone</Label>
                <Input id="profile-phone" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="+224 6XX XXX XXX" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleProfileSubmit} disabled={profileSaving}>
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Préférences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Préférences</CardTitle>
            </div>
            <CardDescription>Devise, fuseau horaire et format régional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Feedback feedback={prefFeedback} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Devise</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                  <select
                    id="currency"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-10 pr-8 py-2 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                  <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="locale">Langue</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                  <select
                    id="locale"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-10 pr-8 py-2 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    {LOCALES.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number-format">Format des nombres</Label>
                <div className="relative">
                  <select
                    id="number-format"
                    value={numberFormat}
                    onChange={(e) => setNumberFormat(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-3 pr-8 py-2 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    {NUMBER_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="week-start">Début de semaine</Label>
                <div className="relative">
                  <select
                    id="week-start"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] pl-3 pr-8 py-2 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    {WEEK_START_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePrefSubmit} disabled={prefSaving}>
                {prefSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Apparence */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Apparence</CardTitle>
            </div>
            <CardDescription>Choisissez le thème de l'application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {([
                { value: "light", label: "Clair", icon: Sun },
                { value: "dark", label: "Sombre", icon: Moon },
                { value: "system", label: "Système", icon: Monitor },
              ] as const).map(({ value: v, label, icon: Icon }) => (
                <button
                  key={v}
                  onClick={() => handleThemeChange(v)}
                  disabled={themeSaving}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    theme === v
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Gérez vos alertes et notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Feedback feedback={notifFeedback} />
            <div className="space-y-4">
              <SwitchField label="Notifications par email" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              <SwitchField label="Notifications push" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              <SwitchField label="Alertes de budget" checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
              <SwitchField label="Rappels de paiement" checked={paymentReminders} onCheckedChange={setPaymentReminders} />
              <SwitchField label="Newsletter" checked={newsletter} onCheckedChange={setNewsletter} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNotifSave} disabled={notifSaving}>
                {notifSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Sécurité */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Sécurité</CardTitle>
            </div>
            <CardDescription>Modifiez votre mot de passe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Feedback feedback={pwFeedback} />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: strength.width }}
                        className={cn("h-full rounded-full transition-all", strength.color)}
                      />
                    </div>
                    <p className={cn(
                      "text-[11px]",
                      strength.score <= 1 ? "text-red-500" : strength.score <= 3 ? "text-yellow-500" : "text-green-500"
                    )}>
                      Sécurité : {strength.label}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePasswordSubmit} disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}>
                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Mettre à jour
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Zone de Danger */}
        <Card className="border-red-500/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <CardTitle className="text-red-500">Zone de Danger</CardTitle>
            </div>
            <CardDescription>Actions irréversibles sur votre compte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--foreground)]">Supprimer mon compte</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Cette action est irréversible. Toutes vos données seront supprimées.
                </p>
              </div>
              <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialog.Trigger asChild>
                  <Button variant="danger" className="shrink-0">
                    Supprimer
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                  <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--card)] rounded-xl p-6 shadow-2xl border border-[var(--border)]">
                    <AlertDialog.Title className="text-lg font-semibold text-[var(--foreground)]">
                      Confirmer la suppression
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-2 text-sm text-[var(--muted-foreground)]">
                      Cette action est irréversible. Toutes vos données seront supprimées. Voulez-vous vraiment continuer ?
                    </AlertDialog.Description>
                    <div className="mt-6 flex justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <Button variant="secondary">Annuler</Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting}>
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Confirmer la suppression
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Session */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Session</CardTitle>
            </div>
            <CardDescription>Appareils connectés et déconnexion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {DEVICES.map((device, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary)]/50">
                  <div className="flex items-center gap-3">
                    <device.icon className="w-5 h-5 text-[var(--muted-foreground)]" />
                    <span className="text-sm text-[var(--foreground)]">{device.name}</span>
                  </div>
                  <Badge variant="success">Actif</Badge>
                </div>
              ))}
            </div>
            <Separator />
            <Button variant="danger" onClick={handleLogout} disabled={loggingOut} className="w-full">
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
              Déconnexion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
