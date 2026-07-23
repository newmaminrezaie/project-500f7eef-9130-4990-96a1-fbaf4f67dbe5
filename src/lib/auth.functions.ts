import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import {
  getSession,
  getCurrentUser,
  seedUsersIfEmpty,
  verifyPassword,
  hashPassword,
} from "./auth.server";
import { one, query } from "./db.server";

const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری را وارد کنید"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    await seedUsersIfEmpty();
    const user = await one<{ id: number; username: string; password_hash: string }>(
      "SELECT id, username, password_hash FROM users WHERE username = $1",
      [data.username.trim()],
    );
    if (!user) return { ok: false as const, error: "نام کاربری یا رمز عبور اشتباه است" };
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) return { ok: false as const, error: "نام کاربری یا رمز عبور اشتباه است" };
    const session = await getSession();
    await session.update({ userId: user.id, username: user.username });
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSession();
  await session.clear();
  return { ok: true as const };
});

export const currentUser = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await seedUsersIfEmpty();
    return await getCurrentUser();
  } catch (e) {
    // Return null with the error message so the UI can show a helpful hint
    // if the DB isn't reachable yet (e.g. in local preview without VPS Postgres).
    return { __dbError: (e as Error).message } as unknown as null;
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "رمز جدید باید حداقل ۶ کاراکتر باشد"),
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => changePasswordSchema.parse(data))
  .handler(async ({ data }) => {
    const me = await getCurrentUser();
    if (!me) throw redirect({ to: "/login" });
    const row = await one<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = $1",
      [me.id],
    );
    if (!row) throw redirect({ to: "/login" });
    const ok = await verifyPassword(data.currentPassword, row.password_hash);
    if (!ok) return { ok: false as const, error: "رمز فعلی اشتباه است" };
    const hash = await hashPassword(data.newPassword);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, me.id]);
    return { ok: true as const };
  });
