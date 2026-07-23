import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { login } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "ورود — حسابداری زعفران رضایی" }] }),
  component: LoginPage,
});

function LoginPage() {
  const doLogin = useServerFn(login);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await doLogin({ data: { username, password } });
      if (res.ok) await navigate({ to: "/app" });
      else setError(res.error);
    } catch (err) {
      setError("مشکلی در ارتباط با سرور پیش آمد. اتصال دیتابیس را بررسی کنید.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/saffron-rezaie-logo.png"
            alt="زعفران رضایی"
            className="mx-auto mb-4 h-32 w-auto"
          />
          <h1 className="text-2xl font-bold text-foreground">حسابداری زعفران رضایی</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            برای ورود، نام کاربری و رمز عبور خود را وارد کنید.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-card p-6 shadow-card">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-foreground">نام کاربری</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              inputMode="text"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-foreground">رمز عبور</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              required
            />
          </label>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "در حال ورود…" : "ورود"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          نسخهٔ ۱ — فروشگاه زعفران رضایی
        </p>
      </div>
    </div>
  );
}
