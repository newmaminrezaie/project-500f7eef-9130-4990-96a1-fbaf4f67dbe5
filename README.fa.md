# حسابداری زعفران رضایی

سامانه حسابداری ساده و فارسی برای فروشگاه زعفران و خشکبار رضایی، طراحی‌شده برای اجرا روی سرور مجازی ایرانی (بدون CDN، آفلاین، کاملاً قابل انتقال).

## قابلیت‌های نسخه ۱

- ورود دو کاربر (شما و پدر)
- مدیریت مشتریان: افزودن، جست‌وجو، ویرایش، حذف
- تلفن کلیک-تماس روی موبایل
- طراحی موبایل‌محور، بزرگ و راحت برای کاربر مسن
- تمام داده‌ها در Postgres محلی روی سرور خودتان — بدون ابر، بدون CDN

## پیش‌نیازها روی VPS

- Docker و Docker Compose (نصب‌شده)
- Nginx یا Caddy برای پروکسی دامنه (نصب‌شده)
- پورت **4000** روی `127.0.0.1` آزاد باشد (پورت ۳۰۰۰ توسط پروژه Higooya اشغال است — این پروژه از پورت ۴۰۰۰ استفاده می‌کند)

## نصب

```bash
git clone <repo-url> rezaie
cd rezaie
cp .env.example .env
# فایل .env را با یک ادیتور باز کنید و تمام مقادیرِ change_me را با مقادیر واقعی جایگزین کنید.
# برای SESSION_SECRET از این دستور استفاده کنید:
openssl rand -hex 32

docker compose up -d --build
```

پس از چند ثانیه، برنامه روی `http://127.0.0.1:4000` در دسترس است.

## اتصال دامنه rezaiesaffron.ir

در Nginx یک server block بسازید:

```nginx
server {
    listen 80;
    server_name rezaiesaffron.ir www.rezaiesaffron.ir;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

سپس با `certbot` گواهی SSL بگیرید:

```bash
certbot --nginx -d rezaiesaffron.ir -d www.rezaiesaffron.ir
```

## پشتیبان‌گیری

```bash
# ساخت فایل پشتیبان
docker compose exec postgres pg_dump -U app app > backup-$(date +%F).sql

# بازیابی روی سرور دیگر
cat backup-YYYY-MM-DD.sql | docker compose exec -T postgres psql -U app app
```

فقط همین یک فایل SQL برای انتقال کامل به هر سرور دیگری کافیست.

## پشتیبان‌گیری خودکار روزانه (اختیاری)

روی سرور یک cron بسازید:

```bash
mkdir -p /var/backups/rezaie
crontab -e
# افزودن خط زیر:
0 3 * * * cd /path/to/rezaie && docker compose exec -T postgres pg_dump -U app app > /var/backups/rezaie/backup-$(date +\%F).sql
```

## به‌روزرسانی

```bash
git pull
docker compose up -d --build
```

داده‌ها در volume به نام `pgdata` باقی می‌مانند و از بین نمی‌روند.

## قابلیت‌های نسخه ۲ (به‌زودی)

- محصولات و موجودی (زعفران، خشکبار، قیمت‌ها)
- فاکتور با پرداخت جزئی و مانده حساب هر مشتری
- ارسال پیامک اطلاع‌رسانی از طریق پنل پیامک ایرانی (پنل انتخاب‌شده در env تنظیم می‌شود)

جدول‌های `products`, `invoices`, `invoice_items`, `payments` از همین حالا در دیتابیس ساخته شده‌اند تا افزودن این قابلیت‌ها در آینده بدون تغییر ساختار انجام شود.

## امنیت

- تمام پسوردها با bcrypt هش می‌شوند.
- session با کوکی امضاشدهٔ رمزنگاری‌شده (`SESSION_SECRET`) ذخیره می‌شود.
- پورت Postgres به بیرون باز نیست — فقط از داخل شبکه Docker قابل دسترس است.
- برنامه از هیچ CDN یا سرویس خارجی استفاده نمی‌کند. فونت‌ها از فونت سیستم اندروید (Vazirmatn/Sahel اگر روی گوشی نصب باشد، وگرنه فونت پیش‌فرض) استفاده می‌کنند.
