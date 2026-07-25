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
  unit_price_toman: string; // BIGINT → string from pg
  old_price_toman: string | null;
  image_url: string | null;
  badge: string | null;
  short_description: string | null;
  stock: string;
  notes: string | null;
};

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => (z.object({ q: z.string().optional() }).optional().parse(d) ?? {}))
  .handler(async ({ data }) => {
    await requireUser();
    const q = (data?.q ?? "").trim();
    if (q) {
      return many<Product>(
        `SELECT id, slug, name, category, weight, unit_price_toman, old_price_toman,
                image_url, badge, short_description, stock, notes
         FROM products
         WHERE name ILIKE $1 OR COALESCE(category,'') ILIKE $1
         ORDER BY category NULLS LAST, name ASC`,
        [`%${q}%`],
      );
    }
    return many<Product>(
      `SELECT id, slug, name, category, weight, unit_price_toman, old_price_toman,
              image_url, badge, short_description, stock, notes
       FROM products
       ORDER BY category NULLS LAST, name ASC`,
    );
  });

const updateSchema = z.object({
  id: z.number().int(),
  stock: z.number().finite().min(0).optional(),
  unit_price_toman: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    await query(
      `UPDATE products SET
         stock = COALESCE($2, stock),
         unit_price_toman = COALESCE($3, unit_price_toman),
         notes = COALESCE($4, notes),
         updated_at = NOW()
       WHERE id = $1`,
      [data.id, data.stock ?? null, data.unit_price_toman ?? null, data.notes ?? null],
    );
    const row = await one<Product>(
      `SELECT id, slug, name, category, weight, unit_price_toman, old_price_toman,
              image_url, badge, short_description, stock, notes
       FROM products WHERE id = $1`,
      [data.id],
    );
    return row!;
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
