
# Yas-style accounting rebuild

Reshape the app to match the screenshot: a dashboard grid of quick actions, a documents list, a reports list, and a 4-tab bottom nav — all in Persian, RTL, mobile-first, tailored to the imported saffron/dried-fruit inventory.

## Bottom navigation (4 tabs)
- **داشبورد** — grid of actions + documents + reports
- **اشخاص** — customers (existing) + suppliers
- **کالا و انبار** — inventory (existing, extended)
- **حساب‌ها** — cash box, bank accounts, checks summary

## Dashboard sections

### ثبت سند (12 action tiles, colored icons)
1. فاکتور فروش — sell products to a customer (line items from catalog, quantity, price, discount; supports partial payment)
2. فاکتور خرید — buy stock from a supplier
3. برگشت از فروش — sales return
4. برگشت به خرید — purchase return
5. دریافت/حواله — receive cash/transfer from customer
6. پرداخت/حواله — pay cash/transfer to supplier
7. دریافت چک — receive check (number, bank, due date, amount)
8. پرداخت چک — issue check
9. خرج چک — endorse a received check to a supplier
10. ثبت درآمد — misc income
11. ثبت هزینه — misc expense (rent, utilities, transport…)
12. تنظیمات — shop settings

### اسناد (documents list)
فاکتورهای فروش، فاکتورهای خرید، برگشت از فروش، برگشت به خرید، هزینه‌ها، درآمدها، چک‌های دریافتی، چک‌های پرداختی، دریافت‌های نقدی، پرداخت‌های نقدی، پیش‌فاکتور.

### گزارشات
گزارش روزانه، ریز گزارش روزانه، گزارشات انبار، گزارش دارایی‌ها، گزارشات کلی، سود و زیان، سود فاکتور، سود فاکتورها.

## Data model (additive migrations in `db.server.ts`)
- `suppliers` (name, phone, notes)
- `accounts` (name, kind: cash|bank, balance_toman)
- `expense_categories`, `income_categories`
- `documents` — polymorphic header: id, kind (sale|purchase|sale_return|purchase_return|receive|pay|receive_check|pay_check|spend_check|income|expense|proforma), party_id, party_kind, account_id, doc_date, total_toman, paid_toman, notes
- `document_items` — doc_id, product_id, description, qty, unit_price_toman, discount_toman
- `checks` — number, bank, due_date, amount_toman, direction (in|out), status (in_hand|deposited|cashed|bounced|spent), party_id, doc_id
- `ledger_entries` — party_id, party_kind, doc_id, amount_toman, direction (debit|credit), created_at (for balance & reports)
- Sales/purchases automatically adjust `products.stock` and account balances.

## Routes
- `/app` — new dashboard (grid + اسناد + گزارشات)
- `/app/docs/sale/new`, `/app/docs/purchase/new`, `/app/docs/sale-return/new`, `/app/docs/purchase-return/new`
- `/app/docs/receive/new`, `/app/docs/pay/new`
- `/app/docs/check-in/new`, `/app/docs/check-out/new`, `/app/docs/check-spend/new`
- `/app/docs/income/new`, `/app/docs/expense/new`, `/app/docs/proforma/new`
- `/app/docs/$kind` — list per kind
- `/app/docs/$kind/$id` — detail
- `/app/reports/daily`, `/app/reports/daily-detail`, `/app/reports/inventory`, `/app/reports/assets`, `/app/reports/overview`, `/app/reports/pnl`, `/app/reports/invoice-profit`, `/app/reports/invoices-profit`
- `/app/accounts` (tab), `/app/people` (tab with customers+suppliers)

## UI / UX
- Colored square icon tiles (لوسید icons) grouped in cards matching the screenshot layout.
- All Persian digits, Toman, Jalali dates, RTL.
- Sale/purchase forms: pick party (autocomplete), add line items from catalog (search), quantity in kg/gram or unit, live total, paid now vs باقی‌مانده, choose account.
- Optimistic updates, TanStack Query cache; suspense loaders.
- Bundle-only fonts and icons (no CDN); works offline via existing SW.

## Scope for this pass
Given the size, I'll ship in this order in one turn:
1. Schema migration + typed server fns for parties, accounts, documents, items, checks, ledger.
2. New 4-tab shell + Yas-style dashboard tiles.
3. Two fully-working document flows first: **فاکتور فروش** and **دریافت** (with cost/stock/ledger side-effects) since they cover the "unpaid customers" core use-case.
4. Stub routes for the remaining tiles (title + "به‌زودی") so navigation matches the screenshot without shipping half-baked flows.
5. Reports: **گزارش روزانه** and **گزارشات انبار** live; others stubbed.

Follow-up turns will fill in purchases, returns, checks, expenses, and remaining reports — each is a self-contained doc-kind reusing the same components.

Reply "برو" to proceed, or tell me which flows to prioritize first.
