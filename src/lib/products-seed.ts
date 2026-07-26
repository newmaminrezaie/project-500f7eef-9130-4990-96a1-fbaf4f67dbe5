// Seed catalog imported from the "Golden Saffron Bazaar" (زعفران خواجوی)
// storefront. Prices are in TOMAN (تومان). Stock is initialized to 0 —
// the store owner sets real stock from the inventory page.

export type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  weight: string;
  price_toman: number;
  old_price_toman?: number;
  image_url?: string;
  badge?: string;
  short_description?: string;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  { slug: "zafaran-negin", name: "زعفران نگین", category: "زعفران", weight: "", price_toman: 0 },
  { slug: "zafaran-supernegin", name: "زعفران سوپرنگین", category: "زعفران", weight: "", price_toman: 0 },
  { slug: "zafaran-daste", name: "زعفران دسته", category: "زعفران", weight: "", price_toman: 0 },
  { slug: "zafaran-narmeh", name: "زعفران نرمه", category: "زعفران", weight: "", price_toman: 0 },
  { slug: "rishe-zafaran", name: "ریشه زعفران", category: "زعفران", weight: "", price_toman: 0 },
  { slug: "zereshk", name: "زرشک", category: "خشکبار", weight: "", price_toman: 0 },
  { slug: "toot-khoshk", name: "توت خشک", category: "خشکبار", weight: "", price_toman: 0 },
  { slug: "annab", name: "عناب", category: "خشکبار", weight: "", price_toman: 0 },
  { slug: "bargheh-zardalu", name: "برگه زردآلو", category: "خشکبار", weight: "", price_toman: 0 },
  { slug: "hel", name: "هل", category: "دمنوش و چای", weight: "", price_toman: 0 },
];
