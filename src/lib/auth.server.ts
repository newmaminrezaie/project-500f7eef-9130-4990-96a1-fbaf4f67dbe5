import bcrypt from "bcryptjs";
import { useSession } from "@tanstack/react-start/server";
import { one, ensureSchema, query } from "./db.server";

export type SessionData = { userId?: number; username?: string };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set (at least 32 characters)");
  }
  return {
    password,
    name: "rezaie_session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export async function getSession() {
  return useSession<SessionData>(sessionConfig());
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.data.userId) return null;
  return one<{ id: number; username: string; display_name: string }>(
    "SELECT id, username, display_name FROM users WHERE id = $1",
    [session.data.userId],
  );
}

export async function seedUsersIfEmpty() {
  await ensureSchema();
  const existing = await one<{ count: string }>("SELECT COUNT(*)::text as count FROM users");
  if (existing && Number(existing.count) > 0) return;

  const owner = {
    username: process.env.OWNER_USERNAME || "owner",
    password: process.env.OWNER_PASSWORD || "changeme1234",
    display_name: process.env.OWNER_NAME || "مدیر",
  };
  const dad = {
    username: process.env.DAD_USERNAME || "dad",
    password: process.env.DAD_PASSWORD || "changeme1234",
    display_name: process.env.DAD_NAME || "پدر",
  };
  for (const u of [owner, dad]) {
    const hash = await bcrypt.hash(u.password, 10);
    await query(
      "INSERT INTO users (username, display_name, password_hash) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING",
      [u.username, u.display_name, hash],
    );
  }
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
