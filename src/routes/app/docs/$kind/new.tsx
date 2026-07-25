import { createFileRoute, useParams, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useMemo, useState } from "react";
import { ChevronRight, Plus, Trash2, Search } from "lucide-react";
import {
  DOC_KINDS,
  KIND_LABEL,
  createSale,
  createPurchase,
  createReceive,
  createSimpleDoc,
  type DocKind,
} from "@/lib/documents.functions";
import { listCustomers } from "@/lib/customers.functions";
import { listProducts } from "@/lib/products.functions";
import { formatToman, toEn, toFa } from "@/lib/format";

export const Route = createFileRoute("/app/docs/$kind/new")({
  head: ({ params }) => ({
    meta: [
      { title: `${KIND_LABEL[params.kind as DocKind] ?? "سند جدید"} — حسابداری زعفران رضایی` },
    ],
  }),
  component: NewDocPage,
});

function assertKind(kind: string): DocKind {
  if ((DOC_KINDS as readonly string[]).includes(kind)) return kind as DocKind;
  return "sale";
}

function CustomerPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number, name: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useSuspenseQuery({
    queryKey: ["customers", q],
    queryFn: () => listCustomers({ data: { q } }),
  });
  const selected = data.find((c) => c.id === value);
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-bold text-muted-foreground">مشتری</span>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={selected ? selected.name : "جست‌وجوی مشتری…"}
            className="w-full rounded-xl border border-input bg-background py-2.5 pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </label>
      {q && data.length > 0 && (
        <ul className="max-h-52 overflow-y-auto rounded-xl border border-border bg-card">
          {data.slice(0, 20).map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.id, c.name);
                  setQ("");
                }}
                className={`flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-right last:border-0 hover:bg-accent ${
                  value === c.id ? "bg-primary/10" : ""
                }`}
              >
                <span className="font-bold">{c.name}</span>
                {c.phone && <span className="text-xs text-muted-foreground num">{c.phone}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/app/customers/new"
        className="inline-flex items-center gap-1 text-xs font-bold text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> افزودن مشتری جدید
      </Link>
    </div>
  );
}

type LineItem = {
  key: string;
  product_id: number | null;
  description: string;
  quantity: string;
  unit_price_toman: string;
};

function ProductSearch({
  onPick,
  onCustom,
}: {
  onPick: (p: { id: number; name: string; price: number }) => void;
  onCustom: (name: string) => void;
}) {
  const [q, setQ] = useState("");
  const { data } = useSuspenseQuery({
    queryKey: ["products", q],
    queryFn: () => listProducts({ data: { q } }),
  });
  const trimmed = q.trim();
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام کالا را بنویسید یا انتخاب کنید…"
          className="w-full rounded-xl border border-input bg-background py-2.5 pe-10 ps-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
      </div>
      {trimmed && (
        <ul className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card">
          {data.slice(0, 40).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPick({ id: p.id, name: p.name, price: Number(p.unit_price_toman) });
                  setQ("");
                }}
                className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-right last:border-0 hover:bg-accent"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold">{p.name}</div>
                  {p.weight && (
                    <div className="text-[11px] text-muted-foreground">{p.weight}</div>
                  )}
                </div>
                <div className="text-xs font-black text-primary num">
                  {formatToman(p.unit_price_toman)}
                </div>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                onCustom(trimmed);
                setQ("");
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-right text-sm font-bold text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              افزودن «{trimmed}» به عنوان کالای جدید
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function SaleForm() {
  const qc = useQueryClient();
  const save = useServerFn(createSale);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [paid, setPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const total = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(toEn(it.quantity)) || 0) * (Number(toEn(it.unit_price_toman)) || 0),
        0,
      ),
    [items],
  );

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!customer) return setErr("مشتری را انتخاب کنید.");
    if (items.length === 0) return setErr("حداقل یک قلم کالا اضافه کنید.");
    setBusy(true);
    try {
      const res = await save({
        data: {
          customer_id: customer.id,
          items: items.map((it) => ({
            product_id: it.product_id,
            description: it.description,
            quantity: Number(toEn(it.quantity)) || 0,
            unit_price_toman: Math.round(Number(toEn(it.unit_price_toman)) || 0),
          })),
          paid_toman: Math.round(Number(toEn(paid)) || 0),
          notes: notes || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["documents"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      await qc.invalidateQueries({ queryKey: ["customerBalances"] });
      await navigate({ to: "/app/docs/$kind/$id", params: { kind: "sale", id: String(res.id) } });
    } catch (e) {
      setErr((e as Error).message || "خطا در ثبت فاکتور");
    } finally {
      setBusy(false);
    }
  }

  const paidNum = Number(toEn(paid)) || 0;
  const remaining = Math.max(0, total - paidNum);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-3xl bg-card p-4 shadow-card">
        <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-secondary" />}>
          <CustomerPicker
            value={customer?.id ?? null}
            onChange={(id, name) => setCustomer({ id, name })}
          />
        </Suspense>
        {customer && (
          <div className="mt-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
            انتخاب‌شده: {customer.name}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-card p-4 shadow-card">
        <h2 className="mb-2 text-sm font-black text-muted-foreground">اقلام فاکتور</h2>
        <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-secondary" />}>
          <ProductSearch
            onPick={(p) =>
              setItems((arr) => [
                ...arr,
                {
                  key: Math.random().toString(36),
                  product_id: p.id,
                  description: p.name,
                  quantity: "1",
                  unit_price_toman: String(p.price),
                },
              ])
            }
          />
        </Suspense>
        {items.length > 0 && (
          <ul className="mt-3 space-y-2">
            {items.map((it, i) => (
              <li key={it.key} className="rounded-xl border border-border p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 font-bold">{it.description}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">تعداد</span>
                    <input
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      inputMode="decimal"
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-right num"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">قیمت واحد</span>
                    <input
                      value={it.unit_price_toman}
                      onChange={(e) => updateItem(i, { unit_price_toman: e.target.value })}
                      inputMode="numeric"
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-right num"
                    />
                  </label>
                </div>
                <div className="mt-1 text-left text-xs font-black text-primary num">
                  {formatToman(
                    (Number(toEn(it.quantity)) || 0) * (Number(toEn(it.unit_price_toman)) || 0),
                  )}{" "}
                  تومان
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl bg-card p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between text-lg">
          <span className="font-bold">جمع کل</span>
          <span className="font-black num text-primary">{formatToman(total)} تومان</span>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">
            پرداخت نقدی (این لحظه)
          </span>
          <input
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-right num"
          />
        </label>
        <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-rose-800">
          <span className="text-sm font-bold">مانده (بدهکار می‌ماند)</span>
          <span className="font-black num">{formatToman(remaining)} تومان</span>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">توضیحات</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
          />
        </label>
      </div>

      {err && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-primary py-3.5 text-base font-black text-primary-foreground shadow-soft disabled:opacity-60"
      >
        {busy ? "در حال ثبت…" : "ثبت فاکتور"}
      </button>
    </form>
  );
}

function ReceiveForm({ kind }: { kind: DocKind }) {
  const qc = useQueryClient();
  const receive = useServerFn(createReceive);
  const simple = useServerFn(createSimpleDoc);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<{ id: number; name: string } | null>(null);
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const needsCustomer =
    kind === "receive" ||
    kind === "pay" ||
    kind === "receive_check" ||
    kind === "pay_check" ||
    kind === "sale_return" ||
    kind === "purchase_return";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const amt = Math.round(Number(toEn(amount)) || 0);
    if (amt <= 0) return setErr("مبلغ معتبر وارد کنید.");
    if (needsCustomer && !customer) return setErr("مشتری را انتخاب کنید.");
    setBusy(true);
    try {
      let id: number;
      if (kind === "receive") {
        const res = await receive({
          data: { customer_id: customer!.id, amount_toman: amt, notes: notes || null },
        });
        id = res.id;
      } else {
        const res = await simple({
          data: {
            kind,
            customer_id: customer?.id ?? null,
            amount_toman: amt,
            notes: notes || null,
          },
        });
        id = res.id;
      }
      await qc.invalidateQueries({ queryKey: ["documents"] });
      await qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      await qc.invalidateQueries({ queryKey: ["customerBalances"] });
      await navigate({ to: "/app/docs/$kind/$id", params: { kind, id: String(id) } });
    } catch (e) {
      setErr((e as Error).message || "خطا در ثبت");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {needsCustomer && (
        <div className="rounded-3xl bg-card p-4 shadow-card">
          <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-secondary" />}>
            <CustomerPicker
              value={customer?.id ?? null}
              onChange={(id, name) => setCustomer({ id, name })}
            />
          </Suspense>
          {customer && (
            <div className="mt-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
              انتخاب‌شده: {customer.name}
            </div>
          )}
        </div>
      )}
      <div className="rounded-3xl bg-card p-4 shadow-card">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">مبلغ (تومان)</span>
          <input
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-xl border border-input bg-background px-3 py-3 text-right text-2xl font-black num"
          />
          <div className="mt-1 text-left text-sm text-muted-foreground num">
            {formatToman(Number(toEn(amount)) || 0)} تومان
          </div>
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-bold text-muted-foreground">توضیحات</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-input bg-background px-3 py-2"
          />
        </label>
      </div>
      {err && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">
          {err}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-primary py-3.5 text-base font-black text-primary-foreground shadow-soft disabled:opacity-60"
      >
        {busy ? "در حال ثبت…" : `ثبت ${KIND_LABEL[kind]}`}
      </button>
    </form>
  );
}

function NewDocPage() {
  const { kind: raw } = useParams({ from: "/app/docs/$kind/new" });
  const kind = assertKind(raw);
  return (
    <div className="space-y-3">
      <Link
        to="/app/docs/$kind"
        params={{ kind }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronRight className="h-4 w-4" />
        {KIND_LABEL[kind]}
      </Link>
      <h1 className="text-2xl font-black text-foreground">{KIND_LABEL[kind]} جدید</h1>
      {kind === "sale" ? <SaleForm /> : <ReceiveForm kind={kind} />}
      <p className="pt-2 text-xs text-muted-foreground">
        {kind === "sale"
          ? "با ثبت فاکتور، موجودی انبار بروزرسانی و مانده مشتری محاسبه می‌شود."
          : "این سند، صندوق و مانده حساب مشتری را بروزرسانی می‌کند."}
      </p>
    </div>
  );
}


