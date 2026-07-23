import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState, useDeferredValue } from "react";
import { Search, Plus, Phone, ChevronLeft } from "lucide-react";
import { listCustomers, type Customer } from "@/lib/customers.functions";
import { toFa } from "@/lib/format";

export const Route = createFileRoute("/app/customers/")({
  head: () => ({ meta: [{ title: "مشتریان — حسابداری زعفران رضایی" }] }),
  component: CustomersPage,
});

function CustomerList({ q }: { q: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["customers", q],
    queryFn: () => listCustomers({ data: { q } }),
  });
  const customers = data as Customer[];

  if (customers.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-8 text-center">
        <div className="text-4xl">🫖</div>
        <div className="mt-3 font-bold text-foreground">
          {q ? "مشتری‌ای پیدا نشد" : "هنوز مشتری‌ای اضافه نکرده‌اید"}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {q ? "عبارت دیگری امتحان کنید." : "اولین مشتری خود را اضافه کنید."}
        </p>
        {!q && (
          <Link
            to="/app/customers/new"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground shadow-soft"
          >
            <Plus className="h-5 w-5" />
            افزودن مشتری
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {customers.map((c) => (
        <li key={c.id}>
          <Link
            to="/app/customers/$id"
            params={{ id: String(c.id) }}
            className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-colors active:bg-accent"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {c.name.trim().charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-foreground">{c.name}</div>
              {c.phone && (
                <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground num">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {toFa(c.phone)}
                </div>
              )}
            </div>
            <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CustomersPage() {
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-foreground">مشتریان</h1>
        <Link
          to="/app/customers/new"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <Plus className="h-5 w-5" />
          جدید
        </Link>
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجوی نام یا شماره…"
          className="w-full rounded-2xl border border-input bg-card py-3 pe-11 ps-4 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          inputMode="search"
        />
      </label>

      <Suspense
        fallback={
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        }
      >
        <CustomerList q={deferredQ} />
      </Suspense>
    </div>
  );
}
