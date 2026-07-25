import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { dashboardSummary } from "@/lib/reports.functions";
import { DOC_TILES, SETTINGS_TILE, DOC_LIST_ITEMS, REPORTS } from "@/lib/doc-catalog";
import { KIND_LABEL } from "@/lib/documents.functions";
import { formatToman, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "داشبورد — حسابداری زعفران رضایی" }] }),
  component: Dashboard,
});

function TopStrip() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardSummary(),
  });
  const today = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <div className="mx-auto w-fit rounded-full bg-secondary px-4 py-1 text-sm font-bold text-secondary-foreground">
        {today}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="صندوق" value={formatToman(data.cash)} tone="emerald" />
        <Stat label="بدهکاری مشتریان" value={formatToman(data.owed)} tone="rose" />
        <Stat label="فروش امروز" value={formatToman(data.todaySales)} tone="violet" />
        <Stat label="کالای کم‌موجود" value={toFa(data.lowStock)} tone="amber" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "violet" | "amber";
}) {
  const map = {
    emerald: "from-emerald-50 to-emerald-100 text-emerald-800",
    rose: "from-rose-50 to-rose-100 text-rose-800",
    violet: "from-violet-50 to-violet-100 text-violet-800",
    amber: "from-amber-50 to-amber-100 text-amber-800",
  } as const;
  return (
    <div className={`rounded-2xl bg-gradient-to-bl p-3 ${map[tone]}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-xl font-black num">{value}</div>
    </div>
  );
}

function TilesGrid() {
  return (
    <section className="rounded-3xl border border-border bg-card p-3 shadow-card">
      <div className="mb-2 flex items-center justify-end px-1">
        <h2 className="text-sm font-black text-muted-foreground">ثبت سند</h2>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {DOC_TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.kind}
              to="/app/docs/$kind/new"
              params={{ kind: t.kind }}
              className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center active:bg-accent"
            >
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl ${t.bg} ${t.fg}`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="text-[11px] font-bold leading-tight text-foreground">
                {t.label}
              </div>
            </Link>
          );
        })}
        <Link
          to="/app/settings"
          className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center active:bg-accent"
        >
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl ${SETTINGS_TILE.bg} ${SETTINGS_TILE.fg}`}
          >
            <SETTINGS_TILE.icon className="h-7 w-7" />
          </div>
          <div className="text-[11px] font-bold leading-tight text-foreground">
            {SETTINGS_TILE.label}
          </div>
        </Link>
      </div>
    </section>
  );
}

function DocsSection() {
  return (
    <section className="rounded-3xl border border-border bg-card p-3 shadow-card">
      <div className="mb-2 flex items-center justify-end px-1">
        <h2 className="text-sm font-black text-muted-foreground">اسناد</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DOC_LIST_ITEMS.map(({ kind, icon: Icon }) => (
          <Link
            key={kind}
            to="/app/docs/$kind"
            params={{ kind }}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground active:bg-accent"
          >
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            <span className="truncate">{KIND_LABEL[kind]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ReportsSection() {
  return (
    <section className="rounded-3xl border border-border bg-card p-3 shadow-card">
      <div className="mb-2 flex items-center justify-end px-1">
        <h2 className="text-sm font-black text-muted-foreground">گزارشات</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.slug}
              to="/app/reports/$slug"
              params={{ slug: r.slug }}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground active:bg-accent"
            >
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${r.bg} ${r.fg}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="flex-1 truncate text-right">{r.label}</span>
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={<div className="h-32 animate-pulse rounded-3xl bg-secondary" aria-hidden />}
      >
        <TopStrip />
      </Suspense>
      <TilesGrid />
      <DocsSection />
      <ReportsSection />
    </div>
  );
}
