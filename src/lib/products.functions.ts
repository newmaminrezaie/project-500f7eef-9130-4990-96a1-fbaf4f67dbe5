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

export type Product = {
  id: number;
  slug: string | null;
  name: string;
  category: string | null;
  weight: string | null;
  unit_price_toman: string;
  old_price_toman: string | null;
  image_url: string | null;
  badge: string | null;
  short_description: string | null;
  stock: string;
  notes: string | null;
  avg_cost_toman: string;
};

const SELECT_COLS = `id, slug, name, category, weight, unit_price_toman, old_price_toman,
  image_url, badge, short_description, stock, notes, avg_cost_toman`;

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => (z.object({ q: z.string().optional() }).optional().parse(d) ?? {}))
  .handler(async ({ data }) => {
    await requireUser();
    const q = (data?.q ?? "").trim();
    if (q) {
      return many<Product>(
        `SELECT ${SELECT_COLS} FROM products
         WHERE name ILIKE $1 OR COALESCE(category,'') ILIKE $1
         ORDER BY name ASC`,
        [`%${q}%`],
      );
    }
    return many<Product>(`SELECT ${SELECT_COLS} FROM products ORDER BY name ASC`);
  });

const updateSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).optional(),
  stock: z.number().finite().min(0).optional(),
  unit_price_toman: z.number().int().nonnegative().optional(),
  avg_cost_toman: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    await query(
      `UPDATE products SET
         name = COALESCE($2, name),
         stock = COALESCE($3, stock),
         unit_price_toman = COALESCE($4, unit_price_toman),
         avg_cost_toman = COALESCE($5, avg_cost_toman),
         notes = COALESCE($6, notes),
         updated_at = NOW()
       WHERE id = $1`,
      [
        data.id,
        data.name ?? null,
        data.stock ?? null,
        data.unit_price_toman ?? null,
        data.avg_cost_toman ?? null,
        data.notes ?? null,
      ],
    );
    return await one<Product>(`SELECT ${SELECT_COLS} FROM products WHERE id = $1`, [data.id]);
  });

const createSchema = z.object({
  name: z.string().min(1),
  stock: z.number().finite().min(0).default(0),
  avg_cost_toman: z.number().int().nonnegative().default(0),
  unit_price_toman: z.number().int().nonnegative().default(0),
});

export const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    const row = await one<Product>(
      `INSERT INTO products (name, stock, avg_cost_toman, unit_price_toman)
       VALUES ($1,$2,$3,$4) RETURNING ${SELECT_COLS}`,
      [data.name, data.stock, data.avg_cost_toman, data.unit_price_toman],
    );
    return row!;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    await query(`DELETE FROM products WHERE id = $1`, [data.id]);
    return { ok: true as const };
  });

export const productStats = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const row = await one<{ total: string; in_stock: string }>(
    `SELECT COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE stock > 0)::text AS in_stock
       FROM products`,
  );
  return { total: Number(row?.total ?? 0), inStock: Number(row?.in_stock ?? 0) };
});
