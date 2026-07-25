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
  { slug: "zafaran-negin-1-mesqal", name: "زعفران نگین (۴.۶ گرمی)", category: "زعفران نگین", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 1100000, old_price_toman: 1400000, image_url: "/images/negin1.webp", badge: "پرفروش", short_description: "زعفران نگین طبیعی گناباد، برداشت آبان ۱۴۰۴، تمام قرمز و پرعطر." },
  { slug: "zafaran-negin-1gram", name: "زعفران نگین (۱ گرمی)", category: "زعفران نگین", weight: "۱ گرم", price_toman: 200000, old_price_toman: 300000, image_url: "/images/1gramNegin1.webp", short_description: "زعفران نگین سوپر صادراتی، امسالی و تازه، تمام قرمز." },
  { slug: "zafaran-supernegin-choobi", name: "زعفران سوپرنگین ظرف چوبی", category: "زعفران نگین", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 1300000, old_price_toman: 1400000, image_url: "/images/final-wooden1-UltraPic.webp", badge: "هدیه ویژه", short_description: "زعفران نگین ۱۴۰۴ در ظرف خاتم داخل جعبه چوبی." },
  { slug: "zafaran-supernegin-gerd", name: "زعفران سوپرنگین ظرف گرد", category: "زعفران نگین", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 1100000, image_url: "/images/Round1-F.webp", short_description: "زعفران نگین گناباد در ظرف گرد فلزی." },
  { slug: "zafaran-supernegin-makhmal", name: "زعفران سوپرنگین جعبه مخمل", category: "زعفران نگین", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 1200000, old_price_toman: 1300000, image_url: "/images/redbox1.webp", badge: "لوکس", short_description: "زعفران نگین ۱۴۰۴ در ظرف خاتم داخل جعبه مخملی قرمز." },
  { slug: "zafaran-supernegin-khatam", name: "زعفران سوپرنگین ظرف خاتم", category: "زعفران نگین", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 1400000, image_url: "/images/Khatam1.webp", short_description: "زعفران نگین امسالی در ظرف فلزی طرح خاتم." },
  { slug: "zafaran-daste", name: "زعفران دسته / دخترپیچ (۴.۶ گرمی)", category: "زعفران دسته", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 800000, old_price_toman: 900000, image_url: "/images/Daste1bgF.webp", short_description: "زعفران دسته (دخترپیچ) قائنات — رشته کامل کلاله + خامه." },
  { slug: "rishe-zafaran", name: "ریشه زعفران (۲.۳ گرمی)", category: "ریشه زعفران", weight: "نیم مثقال (۲.۳ گرم)", price_toman: 200000, image_url: "/images/Sefid1Final.webp", short_description: "ریشه زعفران گناباد — انتخابی اقتصادی برای دمنوش." },
  { slug: "zafaran-narmeh", name: "زعفران نرمه (۴.۶ گرمی)", category: "زعفران نرمه", weight: "۱ مثقال (۴.۶۰۸ گرم)", price_toman: 400000, old_price_toman: 500000, image_url: "/images/narmeh11.webp", short_description: "زعفران نرمه آشپزخانه‌ای، مناسب رستوران و بستنی‌فروشی." },
  { slug: "zereshk-ghaen-500g", name: "زرشک قائنات (نیم کیلو)", category: "خشکبار", weight: "۵۰۰ گرم", price_toman: 350000, old_price_toman: 400000, image_url: "/images/500g-barberry1.webp", badge: "پرفروش", short_description: "زرشک پفکی قائنات، محصول تازه ۱۴۰۴، وکیوم بهداشتی." },
  { slug: "zereshk-pofaki-1kg", name: "زرشک پفکی (۱ کیلویی)", category: "خشکبار", weight: "۱ کیلوگرم", price_toman: 750000, image_url: "/images/zereshk.webp", badge: "عمده", short_description: "یک کیلو زرشک پفکی قائن درجه ۱، پاک شده و بدون روغن." },
  { slug: "toot-khoshk-150g", name: "توت خشک (۱۵۰ گرمی)", category: "خشکبار", weight: "۱۵۰ گرم", price_toman: 95000, old_price_toman: 150000, image_url: "/images/mulbery11-1.webp", short_description: "توت سفید خشک طبیعی، کاملاً ارگانیک، شیرین." },
  { slug: "annab-250g", name: "عناب درشت (۲۵۰ گرمی)", category: "خشکبار", weight: "۲۵۰ گرم", price_toman: 80000, old_price_toman: 120000, image_url: "/images/jujubie1.webp", short_description: "عناب دانه درشت بیرجند، امسالی و تازه." },
  { slug: "bargheh-zardalu-200g", name: "برگه زردآلو (۲۰۰ گرمی)", category: "خشکبار", weight: "۲۰۰ گرم", price_toman: 90000, old_price_toman: 150000, image_url: "/images/persimons1.webp", short_description: "برگه زردآلوی گناباد — بدون مواد نگهدارنده." },
  { slug: "hel-10g", name: "هل درجه ۱ (۱۰ گرمی)", category: "دمنوش و چای", weight: "۱۰ گرم", price_toman: 69000, old_price_toman: 80000, image_url: "/images/Hel1.webp", short_description: "هل خشک اکبری درجه یک، بسته‌بندی ۱۰ گرمی." },
  { slug: "zafaran-negin-500g-omde", name: "زعفران نگین (نیم کیلو — عمده)", category: "عمده‌فروشی", weight: "۵۰۰ گرم", price_toman: 112780000, old_price_toman: 138000000, image_url: "/images/wholesale11.webp", badge: "عمده", short_description: "نگین سوپر صادراتی ۵۰۰ گرمی — امسالی ۱۴۰۴، پرعطر." },
];
