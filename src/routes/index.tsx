import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCurrentUser } from "@/lib/auth.server";

const checkSession = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const u = await getCurrentUser();
    return u ? { signedIn: true as const } : { signedIn: false as const };
  } catch {
    return { signedIn: false as const };
  }
});

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const res = await checkSession();
    if (res.signedIn) throw redirect({ to: "/app" });
    throw redirect({ to: "/login" });
  },
});
