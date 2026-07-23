import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { saveCustomer } from "@/lib/customers.functions";
import { toEn } from "@/lib/format";

export const Route = createFileRoute("/app/customers/new")({
  head: () => ({ meta: [{ title: "مشتری جدید — حسابداری زعفران رضایی" }] }),
  component: NewCustomer,
});

function NewCustomer() {
  const save = useServerFn(saveCustomer);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("نام مشتری را وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      const c = await save({
        data: {
          name: name.trim(),
          phone: phone ? toEn(phone.trim()) : null,
          notes: notes.trim() || null,
        },
      });
      await qc.invalidateQueries({ queryKey: ["customers"] });
      await qc.invalidateQueries({ queryKey: ["customerStats"] });
      await navigate({ to: "/app/customers/$id", params: { id: String(c.id) } });
    } catch (err) {
      console.error(err);
      setError("ذخیره نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

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
        <h1 className="text-2xl font-black text-foreground">مشتری جدید</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">نام و نام خانوادگی</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            autoFocus
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">شماره تماس (اختیاری)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            dir="ltr"
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-right outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 num"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">یادداشت (اختیاری)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            placeholder="مثلاً: مشتری قدیمی، اهل تهران، خریدار زعفران درجه یک…"
          />
        </label>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "ذخیره مشتری"}
        </button>
      </form>
    </div>
  );
}
