import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { listProducts, updateProduct, type Product } from "@/lib/products.functions";
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

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of data) {
      const cat = p.category ?? "بدون دسته";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="rounded-3xl bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
        محصولی یافت نشد.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([cat, items]) => (
        <section key={cat} className="space-y-2">
          <h2 className="px-1 text-sm font-bold text-muted-foreground">{cat}</h2>
          <div className="space-y-2">
            {items.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const save = useServerFn(updateProduct);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [stock, setStock] = useState(String(product.stock ?? "0"));
  const [price, setPrice] = useState(String(product.unit_price_toman ?? "0"));
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          id: product.id,
          stock: Number(toEn(stock)) || 0,
          unit_price_toman: Number(toEn(price)) || 0,
        },
      });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["productStats"] });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const stockNum = Number(product.stock ?? 0);
  const low = stockNum > 0 && stockNum < 3;
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
          {product.weight && (
            <div className="truncate text-xs text-muted-foreground">{product.weight}</div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-primary num">
              {formatToman(product.unit_price_toman)} تومان
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold num ${
                out
                  ? "bg-destructive/15 text-destructive"
                  : low
                    ? "bg-amber-500/15 text-amber-700"
                    : "bg-primary/10 text-primary"
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
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              موجودی
            </span>
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">
              قیمت واحد (تومان)
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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

function InventoryPage() {
  const [q, setQ] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">انبار</h1>
        <p className="text-sm text-muted-foreground">
          موجودی و قیمت محصولات را در اینجا مدیریت کنید.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجوی محصول…"
          className="w-full rounded-2xl border border-input bg-card px-4 py-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <Suspense
        fallback={
          <div className="h-24 animate-pulse rounded-2xl bg-secondary" aria-hidden />
        }
      >
        <InventoryList q={q} />
      </Suspense>
    </div>
  );
}
