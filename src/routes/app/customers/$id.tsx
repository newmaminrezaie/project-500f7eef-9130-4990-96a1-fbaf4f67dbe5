import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Phone, Trash2 } from "lucide-react";
import { getCustomer, saveCustomer, deleteCustomer, type Customer } from "@/lib/customers.functions";
import { toEn, toFa, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/customers/$id")({
  head: () => ({ meta: [{ title: "مشتری — حسابداری زعفران رضایی" }] }),
  component: CustomerDetail,
});

function CustomerForm({ id }: { id: number }) {
  const { data } = useSuspenseQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer({ data: { id } }),
  });
  const customer = data as Customer | null;
  const save = useServerFn(saveCustomer);
  const remove = useServerFn(deleteCustomer);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setNotes(customer.notes ?? "");
  }, [customer]);

  if (!customer) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-secondary/50 p-8 text-center">
        <div className="font-bold">مشتری پیدا نشد</div>
        <Link
          to="/app/customers"
          className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await save({
        data: {
          id,
          name: name.trim(),
          phone: phone ? toEn(phone.trim()) : null,
          notes: notes.trim() || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["customers"] });
      await qc.invalidateQueries({ queryKey: ["customer", id] });
      setMessage("ذخیره شد ✓");
      setTimeout(() => setMessage(null), 1600);
    } catch (err) {
      console.error(err);
      setMessage("خطا در ذخیره");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await remove({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["customers"] });
      await qc.invalidateQueries({ queryKey: ["customerStats"] });
      await navigate({ to: "/app/customers" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {customer.name.trim().charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-black text-foreground">{customer.name}</div>
            <div className="text-xs text-muted-foreground">
              افزوده شده در {formatDate(customer.created_at)}
            </div>
          </div>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success text-success-foreground shadow-soft"
              aria-label="تماس"
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">نام</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">شماره تماس</span>
          <input
            value={toFa(phone)}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">یادداشت</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>

        {message && (
          <div className="rounded-xl bg-success/10 px-4 py-3 text-center text-sm font-semibold text-success">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ذخیرهٔ تغییرات"}
        </button>
      </form>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 py-3 font-bold text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-5 w-5" />
            حذف مشتری
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm font-semibold text-foreground">
              مطمئنید می‌خواهید این مشتری را حذف کنید؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfirmDel(false)}
                className="rounded-2xl border border-input bg-background py-3 font-bold"
              >
                خیر
              </button>
              <button
                onClick={onDelete}
                disabled={busy}
                className="rounded-2xl bg-destructive py-3 font-bold text-destructive-foreground disabled:opacity-60"
              >
                بله، حذف کن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerDetail() {
  const { id: idStr } = Route.useParams();
  const id = Number(idStr);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/app/customers"
          className="grid h-10 w-10 place-items-center rounded-xl bg-card shadow-card"
          aria-label="بازگشت"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-foreground">جزئیات مشتری</h1>
      </div>
      <Suspense
        fallback={<div className="h-40 animate-pulse rounded-3xl bg-secondary" aria-hidden />}
      >
        <CustomerForm id={id} />
      </Suspense>
    </div>
  );
}
