import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useMonthStore } from "../stores/monthStore";
import { useAuthStore } from "../stores/authStore";
import { useQuickAddStore } from "../stores/quickAddStore";
import { DashboardOverview } from "../types/index";
import type { Movement } from "../types";
import {
  TrendingDown, TrendingUp, Wallet, Loader2, ChevronLeft, ChevronRight,
  PiggyBank, HandCoins, Plus, ArrowUpRight, ArrowDownRight, History, FolderOpen,
} from "lucide-react";
import { MONTHS } from "../lib/constants";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { cn } from "../lib/utils";
import { resolveIcon } from "../lib/iconMap";
import { DashboardTransactionsModal, type CardTxnKind } from "../components/dashboard/DashboardTransactionsModal";

const DEFAULT_STATS: DashboardOverview = {
  total_expenses: 0,
  total_incomes: 0,
  available_balance: 0,
  total_savings: 0,
  caisses_available: 0,
  expense_trend: 0,
  income_trend: 0,
  savings_rate: 0,
  today_expenses: 0,
  today_incomes: 0,
  week_expenses: 0,
  week_incomes: 0,
};

const DONUT_COLORS = ["#4F46E5", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9", "#EC4899", "#64748B"];

const TYPE_LABELS: Record<string, string> = {
  apport: "Apport", regulation: "Régulation", transfer: "Transfert",
  expense: "Dépense", income: "Revenu", caisse_fund: "Financement caisse",
  caisse_refund: "Restitution caisse", caisse_close: "Clôture caisse", out: "Perte",
  debt_lend: "Prêt accordé", debt_borrow: "Emprunt",
  debt_repayment: "Remboursement", debt_reversal: "Annulation de dette",
};

export default function DashboardPage() {
  const { currentMonth, currentYear, goPrev, goNext, goToToday } = useMonthStore();
  const { user } = useAuthStore();
  const { openExpense, openIncome } = useQuickAddStore();
  const [stats, setStats] = useState<DashboardOverview>(DEFAULT_STATS);
  const [trends, setTrends] = useState<{ month: string; incomes: number; expenses: number }[]>([]);
  const [breakdown, setBreakdown] = useState<{ category: string; amount: number; percentage: number; color: string; icon: string | null; count: number }[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKind, setActiveKind] = useState<CardTxnKind | null>(null);
  const [txnModalOpen, setTxnModalOpen] = useState(false);

  const openTxn = (kind: CardTxnKind) => {
    setActiveKind(kind);
    setTxnModalOpen(true);
  };

  const currency = user?.currency_code || "GNF";

  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  const formatWeekStart = () => {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch data on month/year change
    setLoading(true);
    setError(null);

    const d = api.get("/dashboard", { params: { month: currentMonth, year: currentYear } });
    const t = api.get("/analytics/trends", { params: { month: currentMonth, year: currentYear } });
    const b = api.get("/analytics/breakdown", { params: { type: "expense", month: currentMonth, year: currentYear } });
    const m = api.get("/movements", { params: { limit: 6, month: currentMonth, year: currentYear } });

    Promise.all([d, t, b, m])
      .then(([dRes, tRes, bRes, mRes]) => {
        setStats(dRes.data?.data || dRes.data || DEFAULT_STATS);
        setTrends(tRes.data?.data || tRes.data || []);
        setBreakdown(bRes.data?.data || bRes.data || []);
        setMovements(mRes.data?.data || mRes.data || []);
      })
      .catch(() => {
        setStats({
          total_expenses: 1_250_000,
          total_incomes: 3_200_000,
          available_balance: 1_950_000,
          total_savings: 500_000,
          caisses_available: 320_000,
          expense_trend: -5.2,
          income_trend: 8.1,
          savings_rate: 15.6,
        });
        setError("Backend non connecté — données d'exemple affichées.");
      })
      .finally(() => setLoading(false));
  }, [currentMonth, currentYear]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n ?? 0);

  const kpis = useMemo(() => {
    const monthLabel = MONTHS[currentMonth - 1];
    return [
      {
        label: "Solde disponible",
        sub: "Tous comptes confondus",
        value: stats.available_balance,
        icon: Wallet,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        kind: "accounts" as CardTxnKind,
      },
      {
        label: `Revenus · ${monthLabel}`,
        sub: stats.income_trend >= 0 ? "+" : "",
        value: stats.total_incomes,
        icon: TrendingUp,
        color: "text-[var(--success)]",
        bg: "bg-[var(--success)]/10",
        trend: stats.income_trend,
        kind: "incomes_month" as CardTxnKind,
      },
      {
        label: `Dépenses · ${monthLabel}`,
        sub: stats.expense_trend >= 0 ? "+" : "",
        value: stats.total_expenses,
        icon: TrendingDown,
        color: "text-[var(--destructive)]",
        bg: "bg-[var(--destructive)]/10",
        trend: stats.expense_trend,
        kind: "expenses_month" as CardTxnKind,
      },
      {
        label: "Caisses",
        sub: "Reste à dépenser",
        value: stats.caisses_available ?? 0,
        icon: HandCoins,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        kind: "caisses" as CardTxnKind,
      },
      {
        label: "Épargne",
        sub: "Progression de l'épargne",
        value: stats.total_savings,
        icon: PiggyBank,
        color: "text-[var(--warning)]",
        bg: "bg-[var(--warning)]/10",
        trend: stats.savings_rate,
        trendText: "d'épargne",
        kind: "savings" as CardTxnKind,
      },
    ];
  }, [stats, currentMonth]);

  const chartData = useMemo(
    () =>
      trends.map((t) => ({
        month: t.month,
        Revenus: Number(t.incomes) || 0,
        Dépenses: Number(t.expenses) || 0,
      })),
    [trends]
  );

  const donutData = useMemo(
    () => breakdown.map((b, i) => ({ ...b, fill: b.color || DONUT_COLORS[i % DONUT_COLORS.length] })),
    [breakdown]
  );

  const outgoing = (m: Movement) =>
    ["expense", "caisse_refund", "caisse_close", "out", "transfer"].includes(m.type);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + sélecteur de mois */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Vue d'ensemble
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Bonjour {user?.name?.split(" ")[0]} 👋 — voici votre résumé financier
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--card)]">
            <button onClick={goPrev} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToToday} className="text-sm font-semibold px-2 hover:text-primary transition-colors">
              {MONTHS[currentMonth - 1]} {currentYear}
            </button>
            <button onClick={goNext} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openExpense}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] px-3 py-2 text-sm font-semibold hover:bg-[var(--destructive)]/15 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Dépense
            </button>
            <button
              onClick={openIncome}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] px-3 py-2 text-sm font-semibold hover:bg-[var(--success)]/15 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Revenu
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {kpis.map((kpi) => (
            <button
              key={kpi.label}
              type="button"
              onClick={() => openTxn(kpi.kind)}
              className="text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--primary)]/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{kpi.label}</p>
                <div className={cn("p-2 rounded-lg", kpi.bg)}>
                  <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold", kpi.color)}>
                {fmt(kpi.value)} {currency}
              </p>
              <p className="text-xs mt-1 font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                Voir les lignes →
              </p>
              {kpi.trend !== undefined && (
                <p className={cn("text-xs mt-1 font-medium", kpi.trend >= 0 ? "text-[var(--success)]" : "text-[var(--destructive)]")}>
                  {kpi.trend >= 0 ? "▲" : "▼"} {Math.abs(kpi.trend).toFixed(1)}% {kpi.trendText || "vs mois dernier"}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Jour & Semaine — uniquement pour le mois en cours */}
      {isCurrentMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <button
            type="button"
            onClick={() => openTxn("expenses_today")}
            className="text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--primary)]/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Dépense du jour</p>
              <div className="p-2 rounded-lg bg-[var(--destructive)]/10">
                <TrendingDown className="w-4 h-4 text-[var(--destructive)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--destructive)]">
              {fmt(stats.today_expenses ?? 0)} {currency}
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              Voir les lignes →
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--muted-foreground)]">
              Aujourd'hui · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </button>

          <button
            type="button"
            onClick={() => openTxn("incomes_today")}
            className="text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--primary)]/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Revenu du jour</p>
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              {fmt(stats.today_incomes ?? 0)} {currency}
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              Voir les lignes →
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--muted-foreground)]">
              Aujourd'hui · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </button>

          <button
            type="button"
            onClick={() => openTxn("expenses_week")}
            className="text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--primary)]/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Dépense de la semaine</p>
              <div className="p-2 rounded-lg bg-[var(--destructive)]/10">
                <TrendingDown className="w-4 h-4 text-[var(--destructive)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--destructive)]">
              {fmt(stats.week_expenses ?? 0)} {currency}
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              Voir les lignes →
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--muted-foreground)]">
              Semaine du {formatWeekStart()}
            </p>
          </button>

          <button
            type="button"
            onClick={() => openTxn("incomes_week")}
            className="text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm hover:border-[var(--primary)]/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Revenu de la semaine</p>
              <div className="p-2 rounded-lg bg-[var(--success)]/10">
                <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              {fmt(stats.week_incomes ?? 0)} {currency}
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              Voir les lignes →
            </p>
            <p className="text-xs mt-1 font-medium text-[var(--muted-foreground)]">
              Semaine du {formatWeekStart()}
            </p>
          </button>
        </div>
      )}

      {/* Tendance + Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trend chart */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Évolution sur 6 mois</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Revenus vs dépenses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" /> Revenus</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--destructive)]" /> Dépenses</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip
                  formatter={(value) => `${fmt(Number(value))} ${currency}`}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="Revenus" stroke="#22C55E" strokeWidth={2} fill="url(#gradInc)" />
                <Area type="monotone" dataKey="Dépenses" stroke="#EF4444" strokeWidth={2} fill="url(#gradExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="font-semibold text-[var(--foreground)]">Dépenses par catégorie</h3>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">{MONTHS[currentMonth - 1]} {currentYear}</p>

          {donutData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 gap-2 text-center">
              <FolderOpen className="w-8 h-8 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">Aucune dépense ce mois-ci</p>
            </div>
          ) : (
            <>
              <div className="relative h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="amount" nameKey="category" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {donutData.map((d) => (
                        <Cell key={d.category} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${fmt(Number(value))} ${currency}`}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {donutData.slice(0, 6).map((d) => {
                  const Icon = resolveIcon(d.icon)
                  return (
                  <div key={d.category} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <Icon className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" />
                      <span className="truncate text-[var(--foreground)]">{d.category}</span>
                    </span>
                    <span className="font-medium text-[var(--muted-foreground)] shrink-0">
                      {d.percentage}% · {fmt(d.amount)}
                    </span>
                  </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-semibold text-[var(--foreground)]">Mouvements du mois</h3>
            <span className="text-xs text-[var(--muted-foreground)]">
              {MONTHS[currentMonth - 1]} {currentYear}
            </span>
          </div>
        </div>
        {movements.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Aucun mouvement ce mois-ci.</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    outgoing(m) ? "bg-[var(--destructive)]/10 text-[var(--destructive)]" : "bg-[var(--success)]/10 text-[var(--success)]"
                  )}
                >
                  {outgoing(m) ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {m.label || TYPE_LABELS[m.type] || m.type}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {TYPE_LABELS[m.type] || m.type} · {new Date(m.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={cn("text-sm font-bold shrink-0", outgoing(m) ? "text-[var(--destructive)]" : "text-[var(--success)]")}>
                  {outgoing(m) ? "−" : "+"}{fmt(Number(m.amount))} {m.currency_code}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal des lignes de transaction */}
      <DashboardTransactionsModal
        open={txnModalOpen}
        onOpenChange={setTxnModalOpen}
        kind={activeKind}
        month={currentMonth}
        year={currentYear}
        currency={currency}
      />
    </div>
  );
}