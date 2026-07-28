import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ShoppingCart, PackagePlus, Settings2 } from "lucide-react";
import { dashboardSummary, profitReport } from "@/lib/reports.functions";
import { formatToman } from "@/lib/format";
import { VoiceEntry } from "@/components/VoiceEntry";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "حسابداری زعفران رضایی" }] }),
  component: Dashboard,
});

function TodayStrip() {
  const { data } = useSuspenseQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => dashboardSummary(),
  });
  const { data: profit } = useSuspenseQuery({
    queryKey: ["profitReport"],
    queryFn: () => profitReport(),
  });
  const today = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return (
    <div className="rounded-3xl bg-card p-4 text-center shadow-card">
      <div className="mx-auto w-fit rounded-full bg-secondary px-4 py-1 text-sm font-bold text-secondary-foreground">
        {today}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-right">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <div className="text-xs text-emerald-800/80">فروش امروز</div>
          <div className="mt-1 num text-lg font-black text-emerald-800">
            {formatToman(data.todaySales)}
          </div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3">
          <div className="text-xs text-rose-800/80">مانده بدهی مشتریان</div>
          <div className="mt-1 num text-lg font-black text-rose-800">
            {formatToman(data.owed)}
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 p-3">
          <div className="text-xs text-amber-900/80">سود امروز</div>
          <div className={`mt-1 num text-lg font-black ${profit.todayProfit >= 0 ? "text-amber-900" : "text-rose-800"}`}>
            {formatToman(profit.todayProfit)}
          </div>
        </div>
        <div className="rounded-2xl bg-sky-50 p-3">
          <div className="text-xs text-sky-900/80">سود کل</div>
          <div className={`mt-1 num text-lg font-black ${profit.totalProfit >= 0 ? "text-sky-900" : "text-rose-800"}`}>
            {formatToman(profit.totalProfit)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-5">
      <Suspense fallback={<div className="h-32 animate-pulse rounded-3xl bg-secondary" />}>
        <TodayStrip />
      </Suspense>

      <VoiceEntry />

      <div className="grid gap-4">
        <Link
          to="/app/docs/$kind/new"
          params={{ kind: "sale" }}
          className="group flex items-center gap-4 rounded-3xl bg-gradient-to-l from-emerald-500 to-emerald-600 p-6 text-white shadow-soft active:scale-[0.99]"
        >
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/20">
            <ShoppingCart className="h-11 w-11" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-3xl font-black">فروختم</div>
            <div className="mt-1 text-sm opacity-90">ثبت فاکتور فروش برای مشتری</div>
          </div>
        </Link>

        <Link
          to="/app/docs/$kind/new"
          params={{ kind: "purchase" }}
          className="group flex items-center gap-4 rounded-3xl bg-gradient-to-l from-sky-500 to-sky-600 p-6 text-white shadow-soft active:scale-[0.99]"
        >
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/20">
            <PackagePlus className="h-11 w-11" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-3xl font-black">خریدم</div>
            <div className="mt-1 text-sm opacity-90">ثبت خرید کالا از تأمین‌کننده</div>
          </div>
        </Link>
      </div>

      <div className="pt-2 text-center">
        <Link
          to="/app/advanced"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
          حالت پیشرفته
        </Link>
      </div>
    </div>
  );
}
