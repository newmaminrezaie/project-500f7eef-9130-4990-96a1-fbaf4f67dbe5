import { Pool, type QueryResult, type QueryResultRow } from "pg";

// Single shared pool. DATABASE_URL is read at first use, not at import time,
// so bundlers that evaluate the module in non-Node runtimes don't crash.
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never);
}

export async function one<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] ?? null;
}

export async function many<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await query<T>(text, params);
  return res.rows;
}

/** Run the schema + seed users if they don't exist. Called on first request. */
let initPromise: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        username    TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        phone       TEXT,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (name);

      -- Reserved for v2 (invoices, payments, products) — created empty so
      -- backups already carry them and future migrations are additive.
      CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        unit        TEXT,
        unit_price_rial BIGINT NOT NULL DEFAULT 0,
        stock       NUMERIC(14,3) NOT NULL DEFAULT 0,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id          SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        total_rial  BIGINT NOT NULL DEFAULT 0,
        paid_rial   BIGINT NOT NULL DEFAULT 0,
        notes       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoice_items (
        id          SERIAL PRIMARY KEY,
        invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        quantity    NUMERIC(14,3) NOT NULL DEFAULT 1,
        unit_price_rial BIGINT NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS payments (
        id          SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        invoice_id  INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        amount_rial BIGINT NOT NULL,
        note        TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })().catch((e) => {
    initPromise = null; // allow retry on next call
    throw e;
  });
  return initPromise;
}
