/** Convert English digits to Persian (for display). */
export function toFa(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const s = String(input);
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

/** Convert Persian/Arabic digits to English (for storage / parsing). */
export function toEn(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Format IRR amounts with Persian digits and thousand separators. */
export function formatRial(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "۰";
  const n = typeof amount === "string" ? Number(toEn(amount)) : amount;
  if (!Number.isFinite(n)) return "۰";
  return toFa(Math.round(n).toLocaleString("en-US"));
}

/** Format an ISO date as Persian date (Jalali via Intl). */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}
