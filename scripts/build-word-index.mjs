/**
 * ساخت فهرست «کلمه‌ی معادلِ عدد» برای تب استخراج (روش ۲).
 *
 * ⚠️ این اسکریپت را باید خودتان، روی سیستم خودتان اجرا کنید (نه در sandbox)،
 * چون به دانلود چند فرهنگ لغت از اینترنت نیاز دارد.
 *
 *   node scripts/build-word-index.mjs
 *
 * خروجی در public/data/word-index.json نوشته می‌شود؛ بعد از ساختنش،
 * دیپلوی کنید تا Worker به آن دسترسی داشته باشد.
 *
 * منابع فعلی:
 *  - فارسی: Lilak (Apache 2.0) از طریق titoBouzout/Dictionaries
 *  - عربی: همان مخزن titoBouzout/Dictionaries
 *  - نام‌های ایرانی/عربی: فهرستِ دستچین‌شده در همین فایل (NAMES) — کاملاً
 *    جامع نیست، ولی شاملِ نام‌های رایج ایرانی و عربی است. هر وقت خواستی
 *    می‌توانی به آرایه‌ی NAMES اضافه کنی.
 *
 * برای اضافه کردن زبان‌های دیگر (کردی/ترکیِ آذری و ...)، فقط یک آیتم
 * جدید با {name, url} به DICTIONARY_SOURCES اضافه کن — فرمت باید ساده
 * (هر خط یک کلمه، با یا بدون فلگ‌های Hunspell بعد از «/») باشد.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DICTIONARY_SOURCES = [
  {
    name: "فارسی (Lilak)",
    url: "https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Persian.dic",
  },
  {
    name: "عربی",
    url: "https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Arabic.dic",
  },
];

// نام‌های رایج ایرانی و عربی — فهرستِ دستچین‌شده (نه از اینترنت، برای پرهیز
// از وابستگی به منبعی که ممکن است در دسترس نباشد). آزادانه قابل‌گسترش است.
const NAMES = [
  // نام‌های پسرانه با ریشه‌ی عربی/دینی
  "محمد", "علی", "حسین", "حسن", "رضا", "مهدی", "احمد", "ابراهیم", "اسماعیل",
  "یوسف", "یعقوب", "داود", "سلیمان", "موسی", "عیسی", "ادریس", "نوح", "هارون",
  "ایوب", "زکریا", "یحیی", "لقمان", "جعفر", "باقر", "صادق", "کاظم", "رسول",
  "امیر", "حیدر", "مرتضی", "مصطفی", "یاسر", "عمار", "بلال", "سالم", "سعید",
  "ولید", "خالد", "طارق", "ماجد", "فهد", "ناصر", "سعد", "فاروق", "عثمان",
  "عمر", "زید", "حمزه", "عباس", "فضل", "نجیب", "کریم", "لطیف", "رحیم",
  "حکیم", "عادل", "جلال", "کمال", "جمال", "شمس", "بدر", "نور", "فرید",
  "وحید", "مجید", "حامد", "راشد", "سلطان", "امین", "صابر", "شاکر", "غفور",
  "رحمان", "یاسین", "طه", "حبیب", "نبیل", "فواد", "جواد", "تقی", "نقی",
  "هادی", "مجتبی", "اسد", "منصور", "ظاهر", "قاسم", "شریف", "صالح", "توفیق",
  // نام‌های دخترانه با ریشه‌ی عربی/دینی
  "فاطمه", "زهرا", "زینب", "مریم", "خدیجه", "رقیه", "حلیمه", "آمنه", "سکینه",
  "معصومه", "نرگس", "سمیرا", "سارا", "هاجر", "بتول", "صدیقه", "طاهره", "کبری",
  "صغری", "حمیده", "رضوان", "نسرین", "یاسمین", "سمیه", "حنانه", "فرشته",
  "ملیکا", "نازنین", "شیرین", "لیلا", "سلمی", "هدی", "امل", "ندا", "رنا",
  "لینا", "دینا", "غزل", "وفا", "منال", "ریم", "لمیس", "دعا",
  // نام‌های پسرانه ایرانی/فارسی
  "کوروش", "داریوش", "بهرام", "آرش", "سیاوش", "رستم", "فرهاد", "شاهین",
  "بابک", "کیوان", "هومن", "پویا", "آرمین", "سهراب", "نیما", "کامران",
  "فریدون", "جمشید", "اردشیر", "شاپور", "خسرو", "بیژن", "گیو", "پیروز",
  "سامان", "آرمان", "بهزاد", "فرزاد", "مهرداد", "فرید", "کیانوش", "آریا",
  // نام‌های دخترانه ایرانی/فارسی
  "مهسا", "ستاره", "بهار", "نگار", "یلدا", "آناهیتا", "رویا", "شبنم",
  "گلاره", "پریسا", "زهره", "پروین", "گلناز", "مهناز", "شیدا", "شکوفه",
  "سپیده", "آرزو", "الناز", "ترانه", "دلارام", "فرزانه", "مینا", "نیلوفر",
  "آیدا", "رها", "بهناز", "مهرناز", "فروزان", "کیانا",
];

const MAX_WORDS_PER_NUMBER = 25; // برای کوچک ماندن حجم فایل خروجی


// همان جدول ابجد کبیر استفاده‌شده در src/index.js
const ABJAD_VALUES = {
  "ا": 1, "ب": 2, "ج": 3, "د": 4, "ه": 5, "و": 6, "ز": 7, "ح": 8, "ط": 9, "ی": 10,
  "ک": 20, "ل": 30, "م": 40, "ن": 50, "س": 60, "ع": 70, "ف": 80, "ص": 90, "ق": 100, "ر": 200,
  "ش": 300, "ت": 400, "ث": 500, "خ": 600, "ذ": 700, "ض": 800, "ظ": 900, "غ": 1000,
};

const NORMALIZE_MAP = {
  "آ": "ا", "أ": "ا", "إ": "ا", "ٱ": "ا",
  "ؤ": "و", "ئ": "ی", "ي": "ی", "ى": "ی",
  "ة": "ه", "ك": "ک", "ء": "ا",
};

function cleanWord(rawLine) {
  // فرمت Hunspell: «کلمه/فلگ‌ها» — فلگ‌ها را دور می‌ریزیم
  let word = rawLine.split("/")[0].trim();
  if (!word) return null;

  const out = [];
  for (const raw of word) {
    if (raw === "\u200c") continue; // نیم‌فاصله را نادیده می‌گیریم
    const ch = NORMALIZE_MAP[raw] || raw;
    if (!ABJAD_VALUES[ch]) return null; // هر نویسه‌ی غیرِ ۲۸ حرفِ ابجد → این خط رد می‌شود
    out.push(ch);
  }
  return out.length ? out.join("") : null;
}

function abjadSum(word) {
  let sum = 0;
  for (const ch of word) sum += ABJAD_VALUES[ch] || 0;
  return sum;
}

async function main() {
  const index = {};
  const seen = new Set();
  const stats = [];

  function addWord(word) {
    if (!word || word.length < 2 || seen.has(word)) return false;
    seen.add(word);
    const sum = abjadSum(word);
    if (!sum) return false;
    if (!index[sum]) index[sum] = [];
    if (index[sum].length < MAX_WORDS_PER_NUMBER) index[sum].push(word);
    return true;
  }

  // ۱) دانلود و پردازش فرهنگ‌های لغت
  for (const src of DICTIONARY_SOURCES) {
    console.log(`در حال دانلود «${src.name}» از: ${src.url}`);
    let kept = 0;
    try {
      const res = await fetch(src.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const lines = text.split("\n").slice(1); // خط اول فایل Hunspell، شمار کلمات است
      for (const line of lines) {
        const word = cleanWord(line);
        if (addWord(word)) kept++;
      }
    } catch (err) {
      console.warn(`  ⚠️ رد شد (${src.name}): ${err.message}`);
    }
    stats.push({ name: src.name, kept });
    console.log(`  ${kept} کلمه از «${src.name}» اضافه شد.`);
  }

  // ۲) نام‌های دستچین‌شده‌ی ایرانی/عربی
  let namesKept = 0;
  for (const raw of NAMES) {
    const word = cleanWord(raw);
    if (addWord(word)) namesKept++;
  }
  stats.push({ name: "نام‌های ایرانی/عربی (دستچین‌شده)", kept: namesKept });
  console.log(`  ${namesKept} نام اضافه شد.`);

  const outPath = fileURLToPath(new URL("../public/data", import.meta.url));
  await mkdir(outPath, { recursive: true });
  await writeFile(
    fileURLToPath(new URL("../public/data/word-index.json", import.meta.url)),
    JSON.stringify(index),
    "utf-8"
  );

  const total = stats.reduce((s, x) => s + x.kept, 0);
  console.log(`\nتمام شد: مجموعاً ${total} کلمه/نام، در ${Object.keys(index).length} مقدار عددی متفاوت.`);
  console.log("خروجی: public/data/word-index.json");
}

main().catch((err) => {
  console.error("خطا:", err.message);
  process.exit(1);
});
