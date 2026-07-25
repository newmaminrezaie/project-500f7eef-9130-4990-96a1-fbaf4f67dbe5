import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "./auth.server";
import { many, one } from "./db.server";

async function requireUser() {
  const me = await getCurrentUser();
  if (!me) throw redirect({ to: "/login" });
  return me;
}

/** High-level dashboard totals: cash, unpaid receivables, low-stock. */
export const dashboardSummary = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const cash = await one<{ v: string }>(
    `SELECT COALESCE(SUM(
       CASE kind
         WHEN 'receive' THEN paid_toman
         WHEN 'receive_check' THEN paid_toman
         WHEN 'income' THEN paid_toman
         WHEN 'sale' THEN paid_toman
         WHEN 'pay' THEN -paid_toman
         WHEN 'pay_check' THEN -paid_toman
         WHEN 'expense' THEN -paid_toman
         ELSE 0
       END
     ),0)::text AS v FROM documents`,
  );
  const owed = await one<{ v: string }>(
    `SELECT COALESCE(SUM(
       CASE kind
         WHEN 'sale' THEN total_toman - paid_toman
         WHEN 'sale_return' THEN -(total_toman - paid_toman)
         WHEN 'receive' THEN -paid_toman
         WHEN 'receive_check' THEN -paid_toman
         ELSE 0
       END
     ),0)::text AS v FROM documents WHERE customer_id IS NOT NULL`,
  );
  const today = await one<{ sales: string; count: string }>(
    `SELECT COALESCE(SUM(total_toman),0)::text AS sales, COUNT(*)::text AS count
       FROM documents WHERE kind='sale' AND doc_date::date = CURRENT_DATE`,
  );
  const low = await one<{ v: string }>(
    `SELECT COUNT(*)::text AS v FROM products WHERE stock > 0 AND stock < 3`,
  );
  return {
    cash: Number(cash?.v ?? 0),
    owed: Number(owed?.v ?? 0),
    todaySales: Number(today?.sales ?? 0),
    todayCount: Number(today?.count ?? 0),
    lowStock: Number(low?.v ?? 0),
  };
});

export const dailyReport = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  return many<{ kind: string; count: string; total: string; paid: string }>(
    `SELECT kind, COUNT(*)::text AS count,
            COALESCE(SUM(total_toman),0)::text AS total,
            COALESCE(SUM(paid_toman),0)::text AS paid
       FROM documents
      WHERE doc_date::date = CURRENT_DATE
      GROUP BY kind
      ORDER BY kind`,
  );
});

export const inventoryReport = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  const rows = await many<{
    category: string | null;
    total: string;
    in_stock: string;
    value: string;
  }>(
    `SELECT category,
            COUNT(*)::text AS total,
            COUNT(*) FILTER (WHERE stock > 0)::text AS in_stock,
            COALESCE(SUM(stock * unit_price_toman),0)::text AS value
       FROM products
      GROUP BY category
      ORDER BY category NULLS LAST`,
  );
  const total = await one<{ v: string }>(
    `SELECT COALESCE(SUM(stock * unit_price_toman),0)::text AS v FROM products`,
  );
  return { byCategory: rows, totalValue: Number(total?.v ?? 0) };
});

export const customerBalances = createServerFn({ method: "GET" }).handler(async () => {
  await requireUser();
  return many<{ id: number; name: string; phone: string | null; balance: string }>(
    `SELECT c.id, c.name, c.phone,
            COALESCE(SUM(
              CASE d.kind
                WHEN 'sale' THEN d.total_toman - d.paid_toman
                WHEN 'sale_return' THEN -(d.total_toman - d.paid_toman)
                WHEN 'receive' THEN -d.paid_toman
                WHEN 'receive_check' THEN -d.paid_toman
                ELSE 0
              END
            ),0)::text AS balance
       FROM customers c
  LEFT JOIN documents d ON d.customer_id = c.id
   GROUP BY c.id
   ORDER BY balance DESC, c.name ASC`,
  );
});
