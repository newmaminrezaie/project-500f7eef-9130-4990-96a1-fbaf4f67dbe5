import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Users, LineChart, Copy, Check, MessageCircle } from "lucide-react";
import { dashboardSummary, customerBalances, profitReport } from "@/lib/reports.functions";
import { formatToman, toFa, formatDate } from "@/lib/format";

function buildReminderSms(name: string, amount: number): string {
  return (
    `سلام ${name.trim()} عزیز،\n` +
    `از خرید شما از زعفران رضایی سپاسگزاریم.\n` +
    `مانده حساب شما نزد ما ${formatToman(amount)} تومان می‌باشد.\n` +
    `در صورت امکان، لطفاً نسبت به تسویه اقدام فرمایید.\n` +
    `با احترام — زعفران رضایی`
  );
}

function CopySmsButton({ name, amount, phone }: { name: string; amount: number; phone?: string | null }) {
  const [copied, setCopied] = useState(false);
  const text = buildReminderSms(name, amount);
  async function onCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary active:bg-primary/20"
        aria-label="کپی پیامک یادآوری"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "کپی شد" : "کپی پیامک"}
      </button>
      {phone && (
        <a
          href={`sms:${phone}?body=${encodeURIComponent(text)}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 active:bg-emerald-500/20"
          aria-label="ارسال پیامک"
        >
          <MessageCircle className="h-4 w-4" />
          ارسال
        </a>
      )}
    </div>
  );
}

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

function BalancesList({
  filter,
  emptyMsg,
  toneClass,
}: {
  filter: "debtors" | "creditors";
  emptyMsg: string;
  toneClass: string;
}) {
  const { data } = useSuspenseQuery({
    queryKey: ["customerBalances"],
    queryFn: () => customerBalances(),
  });
  const rows =
    filter === "debtors"
      ? data.filter((c) => Number(c.balance) > 0)
      : data.filter((c) => Number(c.balance) < 0);
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        {emptyMsg}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {rows.slice(0, 30).map((c) => {
        const amount = Math.abs(Number(c.balance));
        return (
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
                <div className={`text-sm font-black num ${toneClass}`}>
                  {formatToman(amount)}
                </div>
                <div className="text-[11px] text-muted-foreground">تومان</div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProfitSection() {
  const { data } = useSuspenseQuery({
    queryKey: ["profitReport"],
    queryFn: () => profitReport(),
  });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LineChart className="h-4 w-4 text-amber-600" />
            سود امروز
          </div>
          <div className={`mt-1 text-lg font-black num ${data.todayProfit >= 0 ? "text-amber-700" : "text-rose-700"}`}>
            {formatToman(data.todayProfit)}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LineChart className="h-4 w-4 text-sky-600" />
            سود کل
          </div>
          <div className={`mt-1 text-lg font-black num ${data.totalProfit >= 0 ? "text-sky-700" : "text-rose-700"}`}>
            {formatToman(data.totalProfit)}
          </div>
        </div>
      </div>

      {data.recent.length > 0 && (
        <div>
          <div className="px-1 pb-2 text-sm font-black text-muted-foreground">
            سود آخرین فروش‌ها
          </div>
          <ul className="space-y-2">
            {data.recent.map((s) => {
              const pos = s.profit >= 0;
              return (
                <li key={s.id}>
                  <Link
                    to="/app/docs/$kind/$id"
                    params={{ kind: "sale", id: String(s.id) }}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card active:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold text-foreground">
                        {s.customer_name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(s.doc_date)} · فروش {formatToman(s.total)}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-black num ${pos ? "text-emerald-700" : "text-rose-700"}`}>
                        {pos ? "+" : "−"}{formatToman(Math.abs(s.profit))}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {pos ? "سود" : "زیان"}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function AccountsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">حساب‌ها</h1>
        <p className="text-sm text-muted-foreground">صندوق، بدهکاران و طلبکاران در یک نگاه.</p>
      </div>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-secondary" />}>
        <Summary />
      </Suspense>

      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-sm font-black text-muted-foreground">سود و زیان</h2>
        <LineChart className="h-4 w-4 text-muted-foreground" />
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" />}>
        <ProfitSection />
      </Suspense>

      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-sm font-black text-muted-foreground">مشتریان بدهکار (به ما بدهکارند)</h2>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" />}>
        <BalancesList
          filter="debtors"
          emptyMsg="هیچ‌کس به ما بدهکار نیست."
          toneClass="text-rose-700"
        />
      </Suspense>

      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-sm font-black text-muted-foreground">ما بدهکاریم (به تأمین‌کنندگان)</h2>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" />}>
        <BalancesList
          filter="creditors"
          emptyMsg="ما به کسی بدهکار نیستیم."
          toneClass="text-sky-700"
        />
      </Suspense>
    </div>
  );
}
