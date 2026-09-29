import { useEffect, useState } from "react";
import { Loader2, Wallet, TrendingUp, TrendingDown, PiggyBank, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { api } from "../../services/api";
import type { Account } from "../../types/account";
import type { Expense } from "../../types/expense";
import type { Income } from "../../types/income";
import type { Saving } from "../../types";
import { cn } from "../../lib/utils";

export type CardTxnKind =
  | "accounts"
  | "incomes_month"
  | "expenses_month"
  | "savings"
  | "incomes_today"
  | "expenses_today"
  | "incomes_week"
  | "expenses_week";

interface DashboardTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: CardTxnKind | null;
  month: number;
  year: number;
  currency: string;
}

interface Row {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  isOutgoing: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n ?? 0);

const KIND_META: Record<CardTxnKind, { title: string; icon: typeof Wallet; isOutgoing: boolean }> = {
  accounts: { title: "Comptes", icon: Wallet, isOutgoing: false },
  incomes_month: { title: "Revenus du mois", icon: TrendingUp, isOutgoing: false },
  expenses_month: { title: "Dépenses du mois", icon: TrendingDown, isOutgoing: true },
  savings: { title: "Épargne", icon: PiggyBank, isOutgoing: false },
  incomes_today: { title: "Revenus du jour", icon: TrendingUp, isOutgoing: false },
  expenses_today: { title: "Dépenses du jour", icon: TrendingDown, isOutgoing: true },
  incomes_week: { title: "Revenus de la semaine", icon: TrendingUp, isOutgoing: false },
  expenses_week: { title: "Dépenses de la semaine", icon: TrendingDown, isOutgoing: true },
};

function iso(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function weekRange() {
  const now = new Date();
  const dow = now.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  return { start: iso(monday), end: iso(now) };
}

export function DashboardTransactionsModal({
  open,
  onOpenChange,
  kind,
  month,
  year,
  currency,
}: DashboardTransactionsModalProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !kind) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);

    const today = iso(new Date());
    const { start, end } = weekRange();

    const queries: Partial<Record<CardTxnKind, Promise<unknown>>> = {
      accounts: api.get("/accounts").then((r) => r.data),
      incomes_month: api.get("/incomes", { params: { month, year } }).then((r) => r.data),
      expenses_month: api.get("/expenses", { params: { month, year } }).then((r) => r.data),
      savings: api.get("/savings").then((r) => r.data),
      incomes_today: api.get("/incomes", { params: { start_date: today, end_date: today } }).then((r) => r.data),
      expenses_today: api.get("/expenses", { params: { start_date: today, end_date: today } }).then((r) => r.data),
      incomes_week: api.get("/incomes", { params: { start_date: start, end_date: end } }).then((r) => r.data),
      expenses_week: api.get("/expenses", { params: { start_date: start, end_date: end } }).then((r) => r.data),
    };

    const toRows = (data: unknown): Row[] => {
      if (kind === "accounts") {
        return ((data as Account[]) ?? []).map((a) => ({
          id: a.id,
          title: a.name,
          subtitle: a.type,
          amount: Number(a.balance),
          isOutgoing: false,
        }));
      }
      if (kind === "savings") {
        return ((data as Saving[]) ?? []).map((s) => ({
          id: s.id,
          title: s.name,
          subtitle: `Cible : ${fmt(Number(s.target_amount))} ${currency}`,
          amount: Number(s.current_amount),
          isOutgoing: false,
        }));
      }
      if (kind?.startsWith("incomes")) {
        const list = (data as { data?: Income[] }).data ?? (data as Income[] | null) ?? [];
        return list.map((i) => ({
          id: i.id,
          title: i.title,
          subtitle: i.category?.name
            ? `${i.category.name} · ${new Date(i.date).toLocaleDateString("fr-FR")}`
            : new Date(i.date).toLocaleDateString("fr-FR"),
          amount: Number(i.amount),
          isOutgoing: false,
        }));
      }
      const list = (data as { data?: Expense[] }).data ?? (data as Expense[] | null) ?? [];
      return list.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: e.category?.name
          ? `${e.category.name} · ${new Date(e.date).toLocaleDateString("fr-FR")}`
          : new Date(e.date).toLocaleDateString("fr-FR"),
        amount: Number(e.amount),
        isOutgoing: true,
      }));
    };

    queries[kind]
      ?.then((data) => {
        if (cancelled) return;
        setRows(toRows(data));
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger les données.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, kind, month, year, currency]);

  const meta = kind ? KIND_META[kind] : null;
  const total = rows.reduce((s, r) => (r.isOutgoing ? s - r.amount : s + r.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {meta && (
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", meta.isOutgoing ? "bg-[var(--destructive)]/10" : "bg-[var(--success)]/10")}>
                <meta.icon className={cn("w-4 h-4", meta.isOutgoing ? "text-[var(--destructive)]" : "text-[var(--success)]")} />
              </div>
              <DialogTitle>{meta.title}</DialogTitle>
            </div>
            <DialogDescription>
              Lignes de transactions pour cette section
            </DialogDescription>
          </DialogHeader>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-sm text-[var(--destructive)] py-4 text-center">{error}</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <Receipt className="w-8 h-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">Aucune transaction</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">{r.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{r.subtitle}</p>
                </div>
                <span className={cn("text-sm font-bold shrink-0", r.isOutgoing ? "text-[var(--destructive)]" : "text-[var(--success)]")}>
                  {r.isOutgoing ? "−" : "+"}{fmt(r.amount)} {currency}
                </span>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
            <span className="text-sm text-[var(--muted-foreground)]">Total</span>
            <span className={cn("text-base font-bold", total < 0 ? "text-[var(--destructive)]" : "text-[var(--success)]")}>
              {total < 0 ? "−" : "+"}{fmt(Math.abs(total))} {currency}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
