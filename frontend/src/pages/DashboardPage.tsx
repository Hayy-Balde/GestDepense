import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useMonthStore } from "../stores/monthStore";
import { useAuthStore } from "../stores/authStore";
import { DashboardOverview } from "../types/index";
import { TrendingDown, TrendingUp, Wallet, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS } from "../lib/constants";

const DEFAULT_STATS: DashboardOverview = {
  total_expenses: 0,
  total_incomes: 0,
  available_balance: 0,
  total_savings: 0,
  expense_trend: 0,
  income_trend: 0,
  savings_rate: 0,
};

export default function DashboardPage() {
  const { currentMonth, currentYear, goPrev, goNext, goToToday } = useMonthStore();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardOverview>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = user?.currency_code || "GNF";

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get("/dashboard", { params: { month: currentMonth, year: currentYear } })
      .then((res) => {
        setStats(res.data?.data || res.data || DEFAULT_STATS);
      })
      .catch(() => {
        // Fallback mock pendant le développement (backend non disponible)
        setStats({
          total_expenses: 1_250_000,
          total_incomes: 3_200_000,
          available_balance: 1_950_000,
          total_savings: 500_000,
          expense_trend: -5.2,
          income_trend: 8.1,
          savings_rate: 15.6,
        });
        setError("Backend non connecté — données d'exemple affichées.");
      })
      .finally(() => setLoading(false));
  }, [currentMonth, currentYear]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n);

  const kpis = [
    {
      label: "Solde disponible",
      value: stats.available_balance,
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: `Revenus — ${MONTHS[currentMonth - 1]}`,
      value: stats.total_incomes,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-500/10",
      trend: stats.income_trend,
    },
    {
      label: `Dépenses — ${MONTHS[currentMonth - 1]}`,
      value: stats.total_expenses,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-500/10",
      trend: stats.expense_trend,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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

        {/* Sélecteur de mois */}
        <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--card)]">
          <button onClick={goPrev} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="text-sm font-semibold px-2 hover:text-primary transition-colors"
          >
            {MONTHS[currentMonth - 1]} {currentYear}
          </button>
          <button onClick={goNext} className="p-1 rounded hover:bg-[var(--muted)] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bannière erreur API (backend pas encore disponible) */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>
                {fmt(kpi.value)} {currency}
              </p>
              {kpi.trend !== undefined && (
                <p
                  className={`text-xs mt-1 font-medium ${
                    kpi.trend >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {kpi.trend >= 0 ? "▲" : "▼"} {Math.abs(kpi.trend).toFixed(1)}% vs mois dernier
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Graphique placeholder */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 h-64 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[var(--muted)]/30 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[var(--muted-foreground)]" />
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">Graphique des tendances</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Recharts — à implémenter (appel : /api/v1/dashboard/monthly)
        </p>
      </div>
    </div>
  );
}
