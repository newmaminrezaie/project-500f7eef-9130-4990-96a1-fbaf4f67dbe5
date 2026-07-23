import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getCurrentUser } from "./auth.server";
import { many, one, query } from "./db.server";

async function requireUser() {
  const me = await getCurrentUser();
  if (!me) throw redirect({ to: "/login" });
  return me;
}

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const searchSchema = z.object({ q: z.string().optional() }).optional();

export const listCustomers = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => searchSchema.parse(d) ?? {})
  .handler(async ({ data }) => {
    await requireUser();
    const q = (data?.q ?? "").trim();
    if (q) {
      return many<Customer>(
        `SELECT id, name, phone, notes, created_at, updated_at
         FROM customers
         WHERE name ILIKE $1 OR COALESCE(phone,'') ILIKE $1
         ORDER BY name ASC
         LIMIT 500`,
        [`%${q}%`],
      );
    }
    return many<Customer>(
      `SELECT id, name, phone, notes, created_at, updated_at
       FROM customers ORDER BY updated_at DESC LIMIT 500`,
    );
  });

export const getCustomer = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    return one<Customer>(
      `SELECT id, name, phone, notes, created_at, updated_at FROM customers WHERE id = $1`,
      [data.id],
    );
  });

const upsertSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1, "نام مشتری را وارد کنید").max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const saveCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    if (data.id) {
      const row = await one<Customer>(
        `UPDATE customers SET name=$1, phone=$2, notes=$3, updated_at=NOW()
         WHERE id=$4 RETURNING id, name, phone, notes, created_at, updated_at`,
        [data.name, data.phone || null, data.notes || null, data.id],
      );
      return row!;
    }
    const row = await one<Customer>(
      `INSERT INTO customers (name, phone, notes) VALUES ($1, $2, $3)
       RETURNING id, name, phone, notes, created_at, updated_at`,
      [data.name, data.phone || null, data.notes || null],
    );
    return row!;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    await query("DELETE FROM customers WHERE id = $1", [data.id]);
    return { ok: true as const };
  });

export const customerStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const row = await one<{ total: string }>(`SELECT COUNT(*)::text AS total FROM customers`);
  return { total: Number(row?.total ?? 0) };
});
