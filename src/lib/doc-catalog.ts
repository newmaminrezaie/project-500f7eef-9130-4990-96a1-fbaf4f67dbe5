import {
  FileText,
  FileMinus,
  Undo2,
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
  SendHorizonal,
  TrendingUp,
  TrendingDown,
  FileClock,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { DocKind } from "./documents.functions";

export type TileMeta = {
  kind: DocKind;
  label: string;
  icon: LucideIcon;
  /** Tailwind bg utility for the icon square. */
  bg: string;
  /** Tailwind text color for the icon. */
  fg: string;
};

export const DOC_TILES: TileMeta[] = [
  { kind: "sale", label: "فاکتور فروش", icon: FileText, bg: "bg-violet-100", fg: "text-violet-600" },
  { kind: "purchase", label: "فاکتور خرید", icon: FileText, bg: "bg-sky-100", fg: "text-sky-600" },
  { kind: "sale_return", label: "برگشت از فروش", icon: Undo2, bg: "bg-orange-100", fg: "text-orange-600" },
  { kind: "purchase_return", label: "برگشت به خرید", icon: Undo2, bg: "bg-cyan-100", fg: "text-cyan-600" },
  { kind: "receive", label: "دریافت / حواله", icon: ArrowDownCircle, bg: "bg-emerald-100", fg: "text-emerald-600" },
  { kind: "pay", label: "پرداخت / حواله", icon: ArrowUpCircle, bg: "bg-rose-100", fg: "text-rose-600" },
  { kind: "receive_check", label: "دریافت چک", icon: ReceiptText, bg: "bg-teal-100", fg: "text-teal-600" },
  { kind: "pay_check", label: "پرداخت چک", icon: ReceiptText, bg: "bg-fuchsia-100", fg: "text-fuchsia-600" },
  { kind: "spend_check", label: "خرج چک", icon: SendHorizonal, bg: "bg-amber-100", fg: "text-amber-600" },
  { kind: "income", label: "ثبت درآمد", icon: TrendingUp, bg: "bg-green-100", fg: "text-green-600" },
  { kind: "expense", label: "ثبت هزینه", icon: TrendingDown, bg: "bg-red-100", fg: "text-red-600" },
  { kind: "proforma", label: "پیش‌فاکتور", icon: FileClock, bg: "bg-indigo-100", fg: "text-indigo-600" },
];

export const TILE_BY_KIND: Record<DocKind, TileMeta> = Object.fromEntries(
  DOC_TILES.map((t) => [t.kind, t]),
) as Record<DocKind, TileMeta>;

export const SETTINGS_TILE = {
  label: "تنظیمات",
  icon: Settings,
  bg: "bg-slate-100",
  fg: "text-slate-600",
  to: "/app/settings" as const,
};

/** Documents list section (right column mirrors the second screenshot). */
export const DOC_LIST_ITEMS: { kind: DocKind; icon: LucideIcon }[] = [
  { kind: "sale", icon: FileText },
  { kind: "purchase", icon: FileText },
  { kind: "sale_return", icon: Undo2 },
  { kind: "purchase_return", icon: Undo2 },
  { kind: "expense", icon: FileMinus },
  { kind: "income", icon: FileText },
  { kind: "receive_check", icon: ReceiptText },
  { kind: "pay_check", icon: ReceiptText },
  { kind: "receive", icon: ArrowDownCircle },
  { kind: "pay", icon: ArrowUpCircle },
  { kind: "proforma", icon: FileClock },
];

export const REPORTS: { slug: string; label: string; icon: LucideIcon; bg: string; fg: string }[] = [
  { slug: "daily", label: "گزارش روزانه", icon: TrendingUp, bg: "bg-blue-100", fg: "text-blue-600" },
  { slug: "daily-detail", label: "ریز گزارش روزانه", icon: FileText, bg: "bg-sky-100", fg: "text-sky-600" },
  { slug: "inventory", label: "گزارشات انبار", icon: TrendingUp, bg: "bg-emerald-100", fg: "text-emerald-600" },
  { slug: "assets", label: "گزارش دارایی‌ها", icon: FileText, bg: "bg-amber-100", fg: "text-amber-600" },
  { slug: "overview", label: "گزارشات کلی", icon: TrendingUp, bg: "bg-violet-100", fg: "text-violet-600" },
  { slug: "pnl", label: "سود و زیان", icon: TrendingUp, bg: "bg-green-100", fg: "text-green-600" },
  { slug: "invoice-profit", label: "سود فاکتور", icon: FileText, bg: "bg-rose-100", fg: "text-rose-600" },
  { slug: "invoices-profit", label: "سود فاکتورها", icon: FileText, bg: "bg-fuchsia-100", fg: "text-fuchsia-600" },
];
