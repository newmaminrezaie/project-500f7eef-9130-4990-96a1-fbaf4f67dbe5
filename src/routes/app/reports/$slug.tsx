import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { REPORTS } from "@/lib/doc-catalog";
import { dailyReport, inventoryReport } from "@/lib/reports.functions";
import { KIND_LABEL, type DocKind } from "@/lib/documents.functions";
import { formatToman, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/reports/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title:
          (REPORTS.find((r) => r.slug === params.slug)?.label ?? "گزارش") +
          " — حسابداری زعفران رضایی",
      },
    ],
  }),
  component: ReportPage,
});

function DailyReport() {
  const { data } = useSuspenseQuery({
    queryKey: ["dailyReport"],
    queryFn: () => dailyReport(),
  });
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        امروز سندی ثبت نشده است.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {data.map((r) => (
        <li
          key={r.kind}
          className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-card"
        >
          <div>
            <div className="font-bold">{KIND_LABEL[r.kind as DocKind] ?? r.kind}</div>
            <div className="text-xs text-muted-foreground num">{toFa(r.count)} سند</div>
          </div>
          <div className="text-left">
            <div className="font-black num text-foreground">
              {formatToman(Number(r.total) || Number(r.paid))}
            </div>
            <div className="text-[11px] text-muted-foreground">تومان</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InventoryReportView() {
  const { data } = useSuspenseQuery({
    queryKey: ["inventoryReport"],
    queryFn: () => inventoryReport(),
  });
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-gradient-to-l from-emerald-500 to-emerald-600 p-5 text-white shadow-soft">
        <div className="text-sm opacity-90">ارزش کل انبار</div>
        <div className="mt-1 text-3xl font-black num">
          {formatToman(data.totalValue)} تومان
        </div>
      </div>
      <ul className="space-y-2">
        {data.byCategory.map((c) => (
          <li
            key={c.category ?? "-"}
            className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-card"
          >
            <div>
              <div className="font-bold">{c.category ?? "بدون دسته"}</div>
              <div className="text-xs text-muted-foreground num">
                {toFa(c.in_stock)} از {toFa(c.total)} کالا
              </div>
            </div>
            <div className="font-black num text-primary">{formatToman(c.value)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportPage() {
  const { slug } = useParams({ from: "/app/reports/$slug" });
  const meta = REPORTS.find((r) => r.slug === slug);
  return (
    <div className="space-y-3">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronRight className="h-4 w-4" />
        داشبورد
      </Link>
      <h1 className="text-2xl font-black">{meta?.label ?? "گزارش"}</h1>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-secondary" />}>
        {slug === "daily" ? (
          <DailyReport />
        ) : slug === "inventory" ? (
          <InventoryReportView />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-8 text-center">
            <div className="text-3xl">📊</div>
            <div className="mt-2 font-bold">{meta?.label}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              این گزارش در نسخه‌های بعدی افزوده خواهد شد.
            </p>
          </div>
        )}
      </Suspense>
    </div>
  );
}
