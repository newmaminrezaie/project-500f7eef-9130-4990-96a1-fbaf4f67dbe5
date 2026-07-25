import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useState } from "react";
import { Package, Plus, Search, Trash2 } from "lucide-react";
import {
  listProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  type Product,
} from "@/lib/products.functions";
import { formatToman, toFa, toEn } from "@/lib/format";

export const Route = createFileRoute("/app/inventory/")({
  head: () => ({ meta: [{ title: "انبار — حسابداری زعفران رضایی" }] }),
  component: InventoryPage,
});

function InventoryList({ q }: { q: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ["products", q],
    queryFn: () => listProducts({ data: { q } }),
  });

  if (data.length === 0) {
    return (
      <div className="rounded-3xl bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        محصولی یافت نشد. برای افزودن، دکمهٔ «افزودن کالا» را بزنید.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const save = useServerFn(updateProduct);
  const remove = useServerFn(deleteProduct);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [stock, setStock] = useState(String(product.stock ?? "0"));
  const [avg, setAvg] = useState(String(product.avg_cost_toman ?? "0"));
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          id: product.id,
          name: name.trim() || product.name,
          stock: Number(toEn(stock)) || 0,
          avg_cost_toman: Number(toEn(avg)) || 0,
        },
      });
      await qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm(`حذف «${product.name}»؟`)) return;
    setBusy(true);
    try {
      await remove({ data: { id: product.id } });
      await qc.invalidateQueries({ queryKey: ["products"] });
    } finally {
      setBusy(false);
    }
  }

  const stockNum = Number(product.stock ?? 0);
  const out = stockNum <= 0;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-start gap-3 text-right"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Package className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold text-foreground">{product.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-primary num">
              میانگین خرید: {formatToman(product.avg_cost_toman)} تومان
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold num ${
                out ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              {out ? "ناموجود" : `موجودی: ${toFa(stockNum)}`}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <form onSubmit={onSave} className="mt-3 space-y-3 border-t border-border pt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">نام کالا</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">موجودی</span>
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              میانگین قیمت خرید (تومان)
            </span>
            <input
              value={avg}
              onChange={(e) => setAvg(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "در حال ذخیره…" : "ذخیره"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-destructive"
              aria-label="حذف"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold"
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AddProductCard() {
  const create = useServerFn(createProduct);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [avg, setAvg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await create({
        data: {
          name: name.trim(),
          stock: Number(toEn(stock)) || 0,
          avg_cost_toman: Number(toEn(avg)) || 0,
          unit_price_toman: 0,
        },
      });
      await qc.invalidateQueries({ queryKey: ["products"] });
      setName("");
      setStock("");
      setAvg("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-bold text-primary"
      >
        <Plus className="h-5 w-5" />
        افزودن کالا
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="text-base font-bold">افزودن کالای جدید</div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted-foreground">نام کالا</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="مثلاً: برگه زردآلو"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">موجودی</span>
          <input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputMode="decimal"
            placeholder="۰"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted-foreground">
            قیمت خرید (تومان)
          </span>
          <input
            value={avg}
            onChange={(e) => setAvg(e.target.value)}
            inputMode="numeric"
            placeholder="۰"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ثبت کالا"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm font-semibold"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}

function InventoryPage() {
  const [q, setQ] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">انبار</h1>
        <p className="text-sm text-muted-foreground">
          هر کالا فقط با یک نام. میانگین قیمت خرید از ثبت‌های «خریدم» به‌روز می‌شود.
        </p>
      </div>

      <AddProductCard />

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجوی کالا…"
          className="w-full rounded-2xl border border-input bg-card px-4 py-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <Suspense
        fallback={<div className="h-24 animate-pulse rounded-2xl bg-secondary" aria-hidden />}
      >
        <InventoryList q={q} />
      </Suspense>
    </div>
  );
}
