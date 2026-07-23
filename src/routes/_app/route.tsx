import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { Home, Users, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/auth.server";
import { logout } from "@/lib/auth.functions";

const requireAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const u = await getCurrentUser();
    if (!u) return { authed: false as const };
    return { authed: true as const, user: { id: u.id, name: u.display_name } };
  } catch (e) {
    return { authed: false as const, dbError: (e as Error).message };
  }
});

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const res = await requireAuth();
    if (!res.authed) throw redirect({ to: "/login" });
    return { user: res.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  const location = useLocation();
  const doLogout = useServerFn(logout);
  const navigate = useNavigate();

  const path = location.pathname;
  const tabs = [
    { to: "/app", label: "خانه", icon: Home, match: (p: string) => p === "/app" },
    {
      to: "/app/customers",
      label: "مشتریان",
      icon: Users,
      match: (p: string) => p.startsWith("/app/customers"),
    },
    {
      to: "/app/settings",
      label: "تنظیمات",
      icon: Settings,
      match: (p: string) => p.startsWith("/app/settings"),
    },
  ] as const;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-xl">
            🌾
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-foreground">زعفران رضایی</div>
            <div className="truncate text-xs text-muted-foreground">
              خوش آمدید، {user?.name ?? "کاربر"}
            </div>
          </div>
          <button
            onClick={async () => {
              await doLogout({});
              await navigate({ to: "/login" });
            }}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl">
          {tabs.map((t) => {
            const active = t.match(path);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${active ? "stroke-[2.5]" : ""}`}
                  aria-hidden="true"
                />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
