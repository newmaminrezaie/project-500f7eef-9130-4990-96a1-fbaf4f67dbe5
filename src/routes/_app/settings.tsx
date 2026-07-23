import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { KeyRound, LogOut, Database } from "lucide-react";
import { changePassword, logout } from "@/lib/auth.functions";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "تنظیمات — حسابداری زعفران رضایی" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const doChange = useServerFn(changePassword);
  const doLogout = useServerFn(logout);
  const navigate = useNavigate();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await doChange({ data: { currentPassword: cur, newPassword: next } });
      if (res.ok) {
        setMsg({ type: "ok", text: "رمز عبور با موفقیت تغییر کرد." });
        setCur("");
        setNext("");
      } else {
        setMsg({ type: "err", text: res.error });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "err", text: "خطا در تغییر رمز." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-foreground">تنظیمات</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-3xl bg-card p-5 shadow-card"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">تغییر رمز عبور</h2>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">رمز فعلی</span>
          <input
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">رمز جدید (حداقل ۶ کاراکتر)</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            required
            minLength={6}
          />
        </label>

        {msg && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              msg.type === "ok"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-soft disabled:opacity-60"
        >
          {busy ? "در حال ذخیره…" : "تغییر رمز"}
        </button>
      </form>

      <div className="rounded-3xl bg-card p-5 shadow-card">
        <div className="mb-2 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold">پشتیبان‌گیری و انتقال</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          تمام اطلاعات در پایگاه دادهٔ Postgres روی سرور شما ذخیره می‌شود. برای
          پشتیبان‌گیری یا انتقال به سرور دیگر، از دستور زیر روی سرور استفاده کنید:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-background p-3 text-left text-xs" dir="ltr">
{`docker compose exec postgres \\
  pg_dump -U app app > backup.sql`}
        </pre>
        <p className="mt-3 text-sm text-muted-foreground">
          فایل <span className="font-mono" dir="ltr">backup.sql</span> را نگه دارید — همین
          فایل برای بازیابی روی هر سرور دیگری کافیست.
        </p>
      </div>

      <button
        onClick={async () => {
          await doLogout({});
          await navigate({ to: "/login" });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 py-4 font-bold text-destructive"
      >
        <LogOut className="h-5 w-5" />
        خروج از حساب
      </button>
    </div>
  );
}
