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

      -- Inventory / products. Prices in TOMAN (تومان).
      CREATE TABLE IF NOT EXISTS products (
        id                SERIAL PRIMARY KEY,
        slug              TEXT UNIQUE,
        name              TEXT NOT NULL,
        category          TEXT,
        weight            TEXT,
        unit              TEXT,
        unit_price_toman  BIGINT NOT NULL DEFAULT 0,
        old_price_toman   BIGINT,
        image_url         TEXT,
        badge             TEXT,
        short_description TEXT,
        stock             NUMERIC(14,3) NOT NULL DEFAULT 0,
        notes             TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      -- Additive migrations for older deployments where the products table
      -- was created with the pre-Toman schema.
      ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price_toman BIGINT NOT NULL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price_toman BIGINT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      DO $mig$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='products' AND column_name='unit_price_rial') THEN
          ALTER TABLE products DROP COLUMN unit_price_rial;
        END IF;
      END $mig$;
      CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uidx ON products (slug);

      -- Reserved for v2 (invoices, payments). Amounts in TOMAN.
      CREATE TABLE IF NOT EXISTS invoices (
        id           SERIAL PRIMARY KEY,
        customer_id  INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        total_toman  BIGINT NOT NULL DEFAULT 0,
        paid_toman   BIGINT NOT NULL DEFAULT 0,
        notes        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DO $mig$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='invoices' AND column_name='total_rial') THEN
          ALTER TABLE invoices RENAME COLUMN total_rial TO total_toman;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='invoices' AND column_name='paid_rial') THEN
          ALTER TABLE invoices RENAME COLUMN paid_rial TO paid_toman;
        END IF;
      END $mig$;

      CREATE TABLE IF NOT EXISTS invoice_items (
        id                SERIAL PRIMARY KEY,
        invoice_id        INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_id        INTEGER REFERENCES products(id) ON DELETE SET NULL,
        description       TEXT NOT NULL,
        quantity          NUMERIC(14,3) NOT NULL DEFAULT 1,
        unit_price_toman  BIGINT NOT NULL DEFAULT 0
      );
      DO $mig$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='invoice_items' AND column_name='unit_price_rial') THEN
          ALTER TABLE invoice_items RENAME COLUMN unit_price_rial TO unit_price_toman;
        END IF;
      END $mig$;

      CREATE TABLE IF NOT EXISTS payments (
        id            SERIAL PRIMARY KEY,
        customer_id   INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        invoice_id    INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
        amount_toman  BIGINT NOT NULL,
        note          TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DO $mig$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='payments' AND column_name='amount_rial') THEN
          ALTER TABLE payments RENAME COLUMN amount_rial TO amount_toman;
        END IF;
      END $mig$;

      -- v2: Yas-style accounting documents (sales, purchases, receives, pays, checks, expenses, incomes, returns, proforma)
      CREATE TABLE IF NOT EXISTS documents (
        id            SERIAL PRIMARY KEY,
        kind          TEXT NOT NULL,
        customer_id   INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        doc_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        total_toman   BIGINT NOT NULL DEFAULT 0,
        paid_toman    BIGINT NOT NULL DEFAULT 0,
        notes         TEXT,
        meta          JSONB,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS documents_kind_idx ON documents(kind);
      CREATE INDEX IF NOT EXISTS documents_customer_idx ON documents(customer_id);
      CREATE INDEX IF NOT EXISTS documents_date_idx ON documents(doc_date DESC);

      CREATE TABLE IF NOT EXISTS document_items (
        id                SERIAL PRIMARY KEY,
        document_id       INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        product_id        INTEGER REFERENCES products(id) ON DELETE SET NULL,
        description       TEXT NOT NULL,
        quantity          NUMERIC(14,3) NOT NULL DEFAULT 1,
        unit_price_toman  BIGINT NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS document_items_doc_idx ON document_items(document_id);
    `);

    // Seed catalog from the Golden Saffron Bazaar shop if empty.
    const { SEED_PRODUCTS } = await import("./products-seed");
    for (const p of SEED_PRODUCTS) {
      await query(
        `INSERT INTO products
           (slug, name, category, weight, unit_price_toman, old_price_toman,
            image_url, badge, short_description, stock)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0)
         ON CONFLICT (slug) DO NOTHING`,
        [
          p.slug,
          p.name,
          p.category,
          p.weight,
          p.price_toman,
          p.old_price_toman ?? null,
          p.image_url ?? null,
          p.badge ?? null,
          p.short_description ?? null,
        ],
      );
    }
  })().catch((e) => {
    initPromise = null; // allow retry on next call
    throw e;
  });
  return initPromise;
}
