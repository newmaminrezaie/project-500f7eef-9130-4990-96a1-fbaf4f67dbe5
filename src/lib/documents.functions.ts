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

export const DOC_KINDS = [
  "sale",
  "purchase",
  "sale_return",
  "purchase_return",
  "receive",
  "pay",
  "receive_check",
  "pay_check",
  "spend_check",
  "income",
  "expense",
  "proforma",
] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export const KIND_LABEL: Record<DocKind, string> = {
  sale: "فاکتور فروش",
  purchase: "فاکتور خرید",
  sale_return: "برگشت از فروش",
  purchase_return: "برگشت به خرید",
  receive: "دریافت / حواله",
  pay: "پرداخت / حواله",
  receive_check: "دریافت چک",
  pay_check: "پرداخت چک",
  spend_check: "خرج چک",
  income: "ثبت درآمد",
  expense: "ثبت هزینه",
  proforma: "پیش‌فاکتور",
};

export type DocumentRow = {
  id: number;
  kind: DocKind;
  customer_id: number | null;
  customer_name: string | null;
  doc_date: string;
  total_toman: string;
  paid_toman: string;
  notes: string | null;
  created_at: string;
};

export type DocumentItem = {
  id: number;
  document_id: number;
  product_id: number | null;
  description: string;
  quantity: string;
  unit_price_toman: string;
};

export const listDocuments = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({ kind: z.enum(DOC_KINDS), limit: z.number().int().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireUser();
    return many<DocumentRow>(
      `SELECT d.id, d.kind, d.customer_id, c.name AS customer_name,
              d.doc_date, d.total_toman, d.paid_toman, d.notes, d.created_at
         FROM documents d
    LEFT JOIN customers c ON c.id = d.customer_id
        WHERE d.kind = $1
     ORDER BY d.doc_date DESC, d.id DESC
        LIMIT $2`,
      [data.kind, data.limit ?? 200],
    );
  });

export const getDocument = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    const doc = await one<DocumentRow>(
      `SELECT d.id, d.kind, d.customer_id, c.name AS customer_name,
              d.doc_date, d.total_toman, d.paid_toman, d.notes, d.created_at
         FROM documents d
    LEFT JOIN customers c ON c.id = d.customer_id
        WHERE d.id = $1`,
      [data.id],
    );
    if (!doc) return null;
    const items = await many<DocumentItem>(
      `SELECT id, document_id, product_id, description, quantity, unit_price_toman
         FROM document_items WHERE document_id = $1 ORDER BY id ASC`,
      [data.id],
    );
    return { doc, items };
  });

const saleItemSchema = z.object({
  product_id: z.number().int().nullable().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price_toman: z.number().int().nonnegative(),
});

const saleSchema = z.object({
  customer_id: z.number().int(),
  items: z.array(saleItemSchema).min(1),
  paid_toman: z.number().int().nonnegative().default(0),
  notes: z.string().max(2000).optional().nullable(),
});

/** Create a sale invoice: inserts doc + items, decrements stock. */
export const createSale = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => saleSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    const total = data.items.reduce(
      (s, it) => s + Math.round(it.quantity * it.unit_price_toman),
      0,
    );
    const doc = await one<{ id: number }>(
      `INSERT INTO documents (kind, customer_id, total_toman, paid_toman, notes)
       VALUES ('sale', $1, $2, $3, $4) RETURNING id`,
      [data.customer_id, total, Math.min(data.paid_toman, total), data.notes || null],
    );
    for (const it of data.items) {
      await query(
        `INSERT INTO document_items (document_id, product_id, description, quantity, unit_price_toman)
         VALUES ($1,$2,$3,$4,$5)`,
        [doc!.id, it.product_id ?? null, it.description, it.quantity, it.unit_price_toman],
      );
      if (it.product_id) {
        await query(
          `UPDATE products SET stock = GREATEST(0, stock - $2), updated_at = NOW() WHERE id = $1`,
          [it.product_id, it.quantity],
        );
      }
    }
    return { id: doc!.id };
  });

const receiveSchema = z.object({
  customer_id: z.number().int(),
  amount_toman: z.number().int().positive(),
  notes: z.string().max(2000).optional().nullable(),
});

/** Receive cash/transfer from a customer. */
export const createReceive = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => receiveSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    const doc = await one<{ id: number }>(
      `INSERT INTO documents (kind, customer_id, total_toman, paid_toman, notes)
       VALUES ('receive', $1, 0, $2, $3) RETURNING id`,
      [data.customer_id, data.amount_toman, data.notes || null],
    );
    return { id: doc!.id };
  });

const simpleSchema = z.object({
  kind: z.enum(DOC_KINDS),
  customer_id: z.number().int().nullable().optional(),
  amount_toman: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional().nullable(),
});

/** Generic simple entry — used for expense, income, pay, and check flows (v1). */
export const createSimpleDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => simpleSchema.parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    // For expense/income/pay we treat amount as paid_toman (cash movement).
    const isCashOut =
      data.kind === "expense" || data.kind === "pay" || data.kind === "pay_check";
    const isCashIn =
      data.kind === "income" || data.kind === "receive_check";
    const paid = isCashOut || isCashIn ? data.amount_toman : 0;
    const total = isCashOut || isCashIn ? 0 : data.amount_toman;
    const doc = await one<{ id: number }>(
      `INSERT INTO documents (kind, customer_id, total_toman, paid_toman, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.kind, data.customer_id ?? null, total, paid, data.notes || null],
    );
    return { id: doc!.id };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    await query(`DELETE FROM documents WHERE id = $1`, [data.id]);
    return { ok: true as const };
  });

/** Balance per customer: positive = owes us, negative = we owe them (credit). */
export const customerBalance = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ customer_id: z.number().int() }).parse(d))
  .handler(async ({ data }) => {
    await requireUser();
    const row = await one<{ balance: string }>(
      `SELECT COALESCE(SUM(
         CASE kind
           WHEN 'sale' THEN total_toman - paid_toman
           WHEN 'sale_return' THEN -(total_toman - paid_toman)
           WHEN 'receive' THEN -paid_toman
           WHEN 'receive_check' THEN -paid_toman
           ELSE 0
         END
       ),0)::text AS balance
         FROM documents WHERE customer_id = $1`,
      [data.customer_id],
    );
    return { balance: Number(row?.balance ?? 0) };
  });
