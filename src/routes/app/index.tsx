import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Users, Plus } from "lucide-react";
import { customerStats } from "@/lib/customers.functions";
import { toFa } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "خانه — حسابداری زعفران رضایی" }] }),
  component: Dashboard,
});

function StatsCard() {
  const { data } = useSuspenseQuery({
    queryKey: ["customerStats"],
    queryFn: () => customerStats(),
  });
  return (
    <div className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-90">تعداد مشتریان</div>
          <div className="mt-1 text-4xl font-black num">{toFa(data.total)}</div>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-foreground/15">
          <Users className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">خانه</h1>
        <p className="text-sm text-muted-foreground">
          خلاصه‌ای از فروشگاه شما در یک نگاه.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="h-28 animate-pulse rounded-3xl bg-secondary" aria-hidden />
        }
      >
        <StatsCard />
      </Suspense>

      <div className="grid gap-3">
        <Link
          to="/app/customers/new"
          className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card transition-colors hover:bg-accent"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Plus className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-foreground">مشتری جدید</div>
            <div className="text-sm text-muted-foreground">
              افزودن یک مشتری تازه به لیست
            </div>
          </div>
        </Link>

        <Link
          to="/app/customers"
          className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card transition-colors hover:bg-accent"
        >
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-foreground">لیست مشتریان</div>
            <div className="text-sm text-muted-foreground">
              جست‌وجو و ویرایش مشتریان
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-5">
        <div className="text-sm font-bold text-foreground">به زودی</div>
        <p className="mt-1 text-sm text-muted-foreground">
          فاکتورها، بدهکاری‌ها و ارسال پیامک به مشتریان — پس از اتصال پنل پیامک ایرانی.
        </p>
      </div>
    </div>
  );
}
