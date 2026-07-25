import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Wallet, TrendingUp, TrendingDown, Users } from "lucide-react";
import { dashboardSummary, customerBalances } from "@/lib/reports.functions";
import { formatToman, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/accounts")({
  head: () => ({ meta: [{ title: "حساب‌ها — حسابداری زعفران رضایی" }] }),
  component: AccountsPage,
});

function Summary() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardSummary(),
  });
  return (
    <div className="grid gap-3">
      <div className="rounded-3xl bg-gradient-to-l from-emerald-500 to-emerald-600 p-5 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">موجودی صندوق</div>
            <div className="mt-1 text-3xl font-black num">{formatToman(data.cash)} تومان</div>
          </div>
          <Wallet className="h-10 w-10 opacity-90" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            فروش امروز
          </div>
          <div className="mt-1 text-lg font-black num text-foreground">
            {formatToman(data.todaySales)}
          </div>
          <div className="text-xs text-muted-foreground num">
            {toFa(data.todayCount)} فاکتور
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            مانده بدهی مشتریان
          </div>
          <div className="mt-1 text-lg font-black num text-rose-700">
            {formatToman(data.owed)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Debtors() {
  const { data } = useSuspenseQuery({
    queryKey: ["customerBalances"],
    queryFn: () => customerBalances(),
  });
  const debtors = data.filter((c) => Number(c.balance) > 0);
  if (debtors.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        هیچ مشتری بدهکاری ندارد.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {debtors.slice(0, 30).map((c) => (
        <li key={c.id}>
          <Link
            to="/app/customers/$id"
            params={{ id: String(c.id) }}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card active:bg-accent"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
              {c.name.trim().charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-foreground">{c.name}</div>
              {c.phone && (
                <div className="truncate text-xs text-muted-foreground num">{c.phone}</div>
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-black num text-rose-700">
                {formatToman(c.balance)}
              </div>
              <div className="text-[11px] text-muted-foreground">تومان</div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AccountsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">حساب‌ها</h1>
        <p className="text-sm text-muted-foreground">وضعیت صندوق و بدهکاران در یک نگاه.</p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-secondary" />}>
        <Summary />
      </Suspense>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-black text-muted-foreground">مشتریان بدهکار</h2>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" />}>
        <Debtors />
      </Suspense>
    </div>
  );
}
