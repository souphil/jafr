# جفر جامع

اپ وب «جفر جامع» یک Cloudflare Worker است که رابط کاربری آن از پوشه‌ی `public/`
ارائه می‌شود و منطق Worker در `index.js` قرار دارد.

## پیش‌نیازها

- Node.js 20 یا جدیدتر
- Python 3.9 یا جدیدتر
- حساب Cloudflare برای استقرار ابری

پس از دریافت پروژه، وابستگی‌ها را نصب کنید:

```bash
npm install
```

وابستگی Python را نیز نصب کنید:

```bash
python3 -m pip install -r requirements.txt
```

## توسعه‌ی محلی

برای اجرای Worker و رابط کاربری روی سیستم خودتان:

```bash
npm run dev
```

آدرس محلی: <http://localhost:8787>

این دستور فقط محیط محلی Wrangler را اجرا می‌کند و چیزی روی Cloudflare منتشر نمی‌کند.

## استقرار محیط توسعه

برای انتشار یک Worker جداگانه با نام `jafr-jamea-dev`:

```bash
npm run deploy:dev
```

بار اول، Wrangler از شما می‌خواهد وارد حساب Cloudflare شوید. برای ورود دستی:

```bash
npx wrangler login
```

پس از استقرار، Wrangler آدرس Worker محیط توسعه را چاپ می‌کند.

## استقرار تولید

برای انتشار نسخه‌ی تولید با نام `jafr-jamea`:

```bash
npm run deploy:prod
```

میان‌بر `npm run deploy` نیز همین استقرار تولید را اجرا می‌کند. پیش از استقرار
تولید، ابتدا `npm run dev` را اجرا و تغییرات را بررسی کنید.

## ساخت فهرست واژه‌ها

فایل `scripts/build-word-index.mjs` با بسته‌ی PyPI به نام
`mnk-persian-words` فهرست فارسی را می‌سازد و فرهنگ عربی را نیز اضافه می‌کند.
این فایل داخل Worker اجرا نمی‌شود و نباید از آدرس Cloudflare درخواست شود.
Wrangler فقط محتوای `public/` را منتشر می‌کند. فایل قابل استفاده در Cloudflare
این است:

```text
/data/word-index.json
```

برای ساخت یا به‌روزرسانی این فایل در محیط محلی:

```bash
npm run build:word-index
```

خروجی در `public/data/word-index.json` نوشته می‌شود. برای ساخت فهرست و انتشار آن
در یک مرحله، از این دستورات استفاده کنید:

```bash
npm run build:deploy:dev
npm run build:deploy:prod
```

این اسکریپت‌ها فرهنگ‌های لغت را روی سیستم محلی دانلود و پردازش می‌کنند، سپس فایل
JSON تولیدشده را همراه با Worker روی Cloudflare منتشر می‌کنند.

## ساختار اصلی

```text
├── index.js                 # Worker و API
├── wrangler.jsonc           # تنظیمات Wrangler و محیط‌ها
├── public/                  # فایل‌های رابط کاربری
├── scripts/                 # اسکریپت‌های ساخت داده
└── package.json             # دستورات توسعه و استقرار
```