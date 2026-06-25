import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
  Settings, User, Bell, Palette, Shield, LogOut, Save, Loader2,
  Eye, EyeOff, Globe, Clock, CreditCard, Moon, Sun,
  AlertCircle, Check, Trash2, Laptop, ChevronDown, Monitor, SmartphoneIcon,
  QrCode, Key, Copy, Camera,
} from "lucide-react"
import * as Switch from "@radix-ui/react-switch"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { api } from "../services/api"
import { authService } from "../services/auth"
import { useAuthStore } from "../stores/authStore"
import { useUIStore } from "../stores/uiStore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { cn, getInitials } from "../lib/utils"
import { CURRENCIES } from "../lib/constants"

const strengthConfig = [
  { label: "Faible", color: "bg-red-500", min: 0, scoreLabel: "Sécurité : Faible" },
  { label: "Moyen", color: "bg-yellow-500", min: 2, scoreLabel: "Sécurité : Moyen" },
  { label: "Fort", color: "bg-green-500", min: 4, scoreLabel: "Sécurité : Fort" },
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
  return { score, label: strengthConfig[level]!.label, color: strengthConfig[level]!.color, width: widths[level], scoreLabel: strengthConfig[level]!.scoreLabel }
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

interface Session {
  id: string
  name: string
  ip: string
  user_agent: string
  last_used_at: string
  created_at: string
  is_current: boolean
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore()

  const [profileName, setProfileName] = useState(user?.name || "")
  const [profilePhone, setProfilePhone] = useState(user?.phone || "")
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currencyCode, setCurrencyCode] = useState(user?.currency_code || "EUR")
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [locale, setLocale] = useState(user?.locale || "fr")
  const [numberFormat, setNumberFormat] = useState("dot")
  const [weekStart, setWeekStart] = useState("monday")
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefFeedback, setPrefFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [theme, setTheme] = useState<"light" | "dark" | "system">(user?.preferences?.theme || "system")
  const [themeSaving, setThemeSaving] = useState(false)

  const [notifSaving, setNotifSaving] = useState(false)
  const [notifFeedback, setNotifFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const notifDefaults = user?.preferences ?? {
    notifications_enabled: true, weekly_report: false, monthly_report: true,
  }
  const [emailNotifications, setEmailNotifications] = useState(notifDefaults.notifications_enabled ?? true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(false)
  const [newsletter, setNewsletter] = useState(false)

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

  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(true)
  const [qrCodeUri, setQrCodeUri] = useState("")
  const [twoFactorSecret, setTwoFactorSecret] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [twoFactorVerifySaving, setTwoFactorVerifySaving] = useState(false)
  const [twoFactorDisableSaving, setTwoFactorDisableSaving] = useState(false)
  const [twoFactorFeedback, setTwoFactorFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)

  useEffect(() => {
    loadSessions()
    load2FAStatus()
  }, [])

  const loadSessions = async () => {
    try {
      const res = await api.get("/auth/sessions")
      setSessions(res.data)
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false)
    }
  }

  const load2FAStatus = async () => {
    try {
      const res = await api.get("/auth/2fa")
      setTwoFactorEnabled(res.data.enabled)
    } catch {
      // ignore
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleProfileSubmit = async () => {
    setProfileSaving(true)
    setProfileFeedback(null)
    try {
      const res = await api.put("/auth/profile", { name: profileName, phone: profilePhone })
      setUser(res.data.user)
      setProfileFeedback({ type: "success", message: "Profil mis à jour avec succès." })
    } catch (err: any) {
      setProfileFeedback({ type: "error", message: err.response?.data?.message || "Erreur lors de la mise à jour." })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePrefSubmit = async () => {
    setPrefSaving(true)
    setPrefFeedback(null)
    try {
      const res = await api.put("/auth/preferences", {
        currency_code: currencyCode, timezone, locale,
      })
      setUser(res.data.user)
      setPrefFeedback({ type: "success", message: "Préférences enregistrées." })
    } catch {
      setPrefFeedback({ type: "error", message: "Erreur lors de l'enregistrement." })
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
      const res = await api.put("/auth/preferences", { preferences: { theme: newTheme } })
      if (res.data.user) setUser(res.data.user)
    } catch {
      // ignore
    } finally {
      setThemeSaving(false)
    }
  }

  const handleNotifSave = async () => {
    setNotifSaving(true)
    setNotifFeedback(null)
    try {
      const res = await api.put("/auth/preferences", {
        preferences: {
          notifications_enabled: emailNotifications,
          weekly_report: budgetAlerts,
          monthly_report: paymentReminders,
        },
      })
      if (res.data.user) setUser(res.data.user)
      setNotifFeedback({ type: "success", message: "Notifications mises à jour." })
    } catch {
      setNotifFeedback({ type: "error", message: "Erreur lors de la mise à jour." })
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
      await api.put("/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })
      setPwFeedback({ type: "success", message: "Mot de passe mis à jour avec succès." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const msg = err.response?.data?.errors?.current_password?.[0] || "Erreur. Vérifiez votre mot de passe actuel."
      setPwFeedback({ type: "error", message: msg })
    } finally {
      setPwSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setProfileFeedback(null)
    try {
      const formData = new FormData()
      formData.append("avatar", file)
      const res = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setUser(res.data.user)
      setProfileFeedback({ type: "success", message: "Photo de profil mise à jour." })
    } catch {
      setProfileFeedback({ type: "error", message: "Erreur lors du téléchargement." })
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete("/auth/account")
    } catch {
      // ignore
    } finally {
      logout()
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await authService.logout()
    } catch {
      // ignore
    } finally {
      logout()
    }
  }

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id)
    try {
      await api.delete(`/auth/sessions/${id}`)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // ignore
    } finally {
      setRevokingId(null)
    }
  }

  const handleEnable2FA = async () => {
    setTwoFactorFeedback(null)
    try {
      const res = await api.post("/auth/2fa/enable")
      setQrCodeUri(res.data.qr_code_uri)
      setTwoFactorSecret(res.data.secret)
      setTwoFactorCode("")
    } catch (err: any) {
      setTwoFactorFeedback({ type: "error", message: err.response?.data?.message || "Erreur." })
    }
  }

  const handleVerify2FA = async () => {
    setTwoFactorVerifySaving(true)
    setTwoFactorFeedback(null)
    try {
      const res = await api.post("/auth/2fa/verify", { code: twoFactorCode })
      setRecoveryCodes(res.data.recovery_codes)
      setTwoFactorEnabled(true)
      setShowRecoveryCodes(true)
      setTwoFactorFeedback({ type: "success", message: "2FA activée avec succès !" })
    } catch (err: any) {
      const msg = err.response?.data?.errors?.code?.[0] || err.response?.data?.message || "Code invalide."
      setTwoFactorFeedback({ type: "error", message: msg })
    } finally {
      setTwoFactorVerifySaving(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!twoFactorCode) {
      setTwoFactorFeedback({ type: "error", message: "Entrez un code 2FA pour désactiver." })
      return
    }
    setTwoFactorDisableSaving(true)
    setTwoFactorFeedback(null)
    try {
      await api.post("/auth/2fa/disable", { code: twoFactorCode })
      setTwoFactorEnabled(false)
      setQrCodeUri("")
      setTwoFactorSecret("")
      setRecoveryCodes([])
      setShowRecoveryCodes(false)
      setTwoFactorCode("")
      setTwoFactorFeedback({ type: "success", message: "2FA désactivée." })
    } catch (err: any) {
      const msg = err.response?.data?.errors?.code?.[0] || err.response?.data?.message || "Code invalide."
      setTwoFactorFeedback({ type: "error", message: msg })
    } finally {
      setTwoFactorDisableSaving(false)
    }
  }

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"))
  }

  const feedbackColors = (type: "success" | "error") =>
    type === "success"
      ? "bg-green-500/10 border-green-500/20 text-green-600"
      : "bg-red-500/10 border-red-500/20 text-red-600"

  function Feedback({ feedback }: { feedback: { type: "success" | "error"; message: string } | null }) {
    if (!feedback) return null
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-center gap-2 p-3 rounded-lg text-sm border", feedbackColors(feedback.type))}
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
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user ? getInitials(user.name) : <User className="w-6 h-6" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
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
              <SwitchField label="Rapport hebdomadaire" checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
              <SwitchField label="Rapport mensuel" checked={paymentReminders} onCheckedChange={setPaymentReminders} />
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

        {/* Section 5: Sécurité - Mot de passe */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Mot de passe</CardTitle>
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
                    <p className={cn("text-[11px]", strength.score <= 1 ? "text-red-500" : strength.score <= 3 ? "text-yellow-500" : "text-green-500")}>
                      {strength.scoreLabel}
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

        {/* Section 6: Authentification à deux facteurs (2FA) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Authentification à deux facteurs (2FA)</CardTitle>
            </div>
            <CardDescription>
              {twoFactorLoading
                ? "Chargement..."
                : twoFactorEnabled
                  ? "La 2FA est activée sur votre compte."
                  : "Ajoutez une couche de sécurité supplémentaire à votre compte."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Feedback feedback={twoFactorFeedback} />

            {!twoFactorLoading && !twoFactorEnabled && !qrCodeUri && (
              <Button onClick={handleEnable2FA}>
                <QrCode className="w-4 h-4 mr-2" />
                Activer la 2FA
              </Button>
            )}

            {qrCodeUri && !twoFactorEnabled && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.) :
                </p>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUri)}`} alt="QR Code 2FA" className="w-48 h-48" />
                  </div>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] text-center">
                  Ou saisissez manuellement la clé : <code className="bg-[var(--secondary)] px-1 rounded">{twoFactorSecret}</code>
                </p>
                <div className="space-y-1.5 max-w-xs mx-auto">
                  <Label htmlFor="2fa-code">Code à 6 chiffres</Label>
                  <Input
                    id="2fa-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex justify-center gap-3">
                  <Button onClick={handleVerify2FA} disabled={twoFactorVerifySaving || twoFactorCode.length !== 6}>
                    {twoFactorVerifySaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Vérifier et activer
                  </Button>
                </div>
              </div>
            )}

            {showRecoveryCodes && recoveryCodes.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-yellow-600">Codes de récupération</p>
                  <button onClick={copyCodes} className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                    <Copy className="w-3 h-3" /> Copier
                  </button>
                </div>
                <p className="text-xs text-yellow-600/80">
                  Conservez ces codes en lieu sûr. Ils vous permettent de vous connecter si vous perdez l'accès à votre application d'authentification.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, i) => (
                    <code key={i} className="bg-yellow-500/10 px-2 py-1 rounded text-sm font-mono text-center">{code}</code>
                  ))}
                </div>
              </div>
            )}

            {!twoFactorLoading && twoFactorEnabled && !showRecoveryCodes && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Activée</Badge>
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <Label htmlFor="2fa-disable-code">Code 2FA pour désactiver</Label>
                  <Input
                    id="2fa-disable-code"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <Button variant="danger" onClick={handleDisable2FA} disabled={twoFactorDisableSaving || twoFactorCode.length !== 6}>
                  {twoFactorDisableSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Désactiver la 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 7: Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SmartphoneIcon className="w-5 h-5 text-[var(--primary)]" />
              <CardTitle>Sessions actives</CardTitle>
            </div>
            <CardDescription>Appareils connectés à votre compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">Aucune session active.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--secondary)]/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Laptop className="w-5 h-5 text-[var(--muted-foreground)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--foreground)] truncate">{session.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {session.user_agent !== "N/A" ? session.user_agent.split("/")[0] : "Inconnu"}
                          {" · "}
                          {session.last_used_at !== "Jamais" ? `Actif ${session.last_used_at}` : session.created_at}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={session.is_current ? "success" : "secondary"}>
                        {session.is_current ? "Actuelle" : "Active"}
                      </Badge>
                      {!session.is_current && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokingId === session.id}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {revokingId === session.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Révoquer"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <Button variant="danger" onClick={handleLogout} disabled={loggingOut} className="w-full">
              {loggingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
              Déconnexion
            </Button>
          </CardContent>
        </Card>

        {/* Section 8: Zone de Danger */}
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
      </div>
    </div>
  )
}
