import WORD_INDEX from "./public/data/word-index.json" with { type: "json" };

/**
 * جفر جامع — Cloudflare Worker
 * ---------------------------------------------------------------
 * منطق اصلی:
 *  کتاب جفر جامع از ۲۸ جزء × ۲۸ صفحه × ۲۸ سطر × ۲۸ خانه تشکیل شده،
 *  و هر خانه دقیقاً ۴ حرف دارد. طبق منابع سنتی، خانه‌ی
 *  (جزء=j, صفحه=s, سطر=t, خانه=k) دقیقاً از چهار حرفِ متناظر با
 *  اندیس‌های j، s، t، k در دایره‌ی ابجدِ ۲۸ حرفی تشکیل می‌شود:
 *
 *      خانه(j, s, t, k) = [ حرف(j), حرف(s), حرف(t), حرف(k) ]
 *
 *  یعنی جزء اول صفحه اول سطر اول خانه اول = «ا ا ا ا»
 *       جزء اول صفحه اول سطر اول خانه دوم = «ا ا ا ب»  ...
 *       تا آخرین خانه = «غ غ غ غ»
 *
 *  این یعنی کل کتاب (۶۱۴٬۶۵۶ خانه) نیازی به ذخیره‌سازی ندارد و
 *  کاملاً به‌صورت تابعی (deterministic) قابل تولید است.
 * ---------------------------------------------------------------
 */

// ترتیب سنتیِ ۲۸ حرفیِ «ابجد هوز حطی کلمن سعفص قرشت ثخذ ضظغ»
const ALPHABET = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ی",
  "ک", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق", "ر",
  "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

// مقادیر ابجد کبیر، به همان ترتیب بالا
const ABJAD_VALUES = {
  "ا": 1, "ب": 2, "ج": 3, "د": 4, "ه": 5, "و": 6, "ز": 7, "ح": 8, "ط": 9, "ی": 10,
  "ک": 20, "ل": 30, "م": 40, "ن": 50, "س": 60, "ع": 70, "ف": 80, "ص": 90, "ق": 100, "ر": 200,
  "ش": 300, "ت": 400, "ث": 500, "خ": 600, "ذ": 700, "ض": 800, "ظ": 900, "غ": 1000,
};

// نام تهجی (spelled-out) حروف — طبق جدول تأییدشده
const LETTER_SPELLING = {
  "ا": "الف", "ب": "با", "ج": "جیم", "د": "دال", "ه": "ها", "و": "واو", "ز": "زا",
  "ح": "حا", "ط": "طا", "ی": "یا", "ک": "کاف", "ل": "لام", "م": "میم", "ن": "نون",
  "س": "سین", "ع": "عین", "ف": "فا", "ص": "صاد", "ق": "قاف", "ر": "را", "ش": "شین",
  "ت": "تا", "ث": "ثا", "خ": "خا", "ذ": "ذال", "ض": "ضاد", "ظ": "ظا", "غ": "غین",
};

const LETTER_INDEX = new Map(ALPHABET.map((ch, i) => [ch, i]));

// نگاشت نویسه‌های رایج به الفبای ۲۸ حرفی (نرمال‌سازی ورودی آزاد کاربر)
const NORMALIZE_MAP = {
  "آ": "ا", "أ": "ا", "إ": "ا", "ٱ": "ا",
  "ؤ": "و",
  "ئ": "ی", "ي": "ی", "ى": "ی",
  "ة": "ه",
  "ك": "ک",
  "ء": "ا",
};

function normalizeText(text) {
  const out = [];
  for (const raw of String(text || "")) {
    const ch = NORMALIZE_MAP[raw] || raw;
    if (LETTER_INDEX.has(ch)) out.push(ch);
  }
  return out;
}

function clampLetterNumber(n) {
  // عدد ۱ تا ۲۸ را برمی‌گرداند (۰ می‌شود ۲۸)
  const m = ((n % 28) + 28) % 28;
  return m === 0 ? 28 : m;
}

function letterAt(oneBasedIndex) {
  return ALPHABET[oneBasedIndex - 1];
}

// خانه‌ی (جزء، صفحه، سطر، خانه) را برمی‌گرداند — هر عدد بین ۱ تا ۲۸
function getHouse(jozv, safhe, satr, khane) {
  return {
    jozv, safhe, satr, khane,
    letters: [letterAt(jozv), letterAt(safhe), letterAt(satr), letterAt(khane)],
  };
}

// کل یک صفحه (۲۸ سطر × ۲۸ خانه) را برمی‌گرداند
function getPage(jozv, safhe) {
  const rows = [];
  for (let t = 1; t <= 28; t++) {
    const cells = [];
    for (let k = 1; k <= 28; k++) {
      cells.push(getHouse(jozv, safhe, t, k).letters.join(""));
    }
    rows.push(cells);
  }
  return { jozv, safhe, jozvLetter: letterAt(jozv), safheLetter: letterAt(safhe), rows };
}

// محاسبه‌ی ابجد یک متن: تفکیک حرف‌به‌حرف + مجموع + رد به آحاد
function computeAbjad(text) {
  const letters = normalizeText(text);
  const breakdown = letters.map((ch) => ({ letter: ch, value: ABJAD_VALUES[ch] }));
  const total = breakdown.reduce((s, b) => s + b.value, 0);
  let reduced = total;
  while (reduced > 9) {
    reduced = String(reduced)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return { letters, breakdown, total, raddeAhad: reduced };
}

/**
 * استخراج مستحصله از سؤال/اسم — بر پایه‌ی روش سنتیِ رایج
 * «ملفوظی / ملبوبی / مسروری» با این تفسیرِ ساختاریافته:
 *
 *  ملفوظی  = حروفِ خودِ متن، به همان ترتیب (بدون فاصله/اعراب)
 *  ملبوبی  = «بینه»‌ی هر حرف: باقیِ حروفِ تهجی (اسم نوشتاریِ) آن حرف
 *            پس از حذف حرف اول (مثلاً «ب» ← «باء» ← بدون «ب» ← «اء» ← ا)
 *  مسروری  = همان حروفِ ملفوظی ولی به ترتیب معکوس (خوانشِ نهان/پنهان)
 *
 *  این سه ردیف را به‌صورت متناوب (امتزاج) با هم ترکیب می‌کنیم،
 *  سپس از مجموعِ ابجدیِ کل دنباله‌ی به‌دست‌آمده، چهار عدد ۱ تا ۲۸
 *  (به ترتیب: خانه، سطر، صفحه، جزء) با تقسیم‌های متوالی بر ۲۸
 *  استخراج می‌شود.
 *
 *  ⚠️ روش اصیل و دست‌نویسِ علمای جفر تعیّنِ ثابتی ندارد و از استاد
 *  به استاد تفاوت دارد؛ آنچه اینجا پیاده شده یک قرائتِ محاسباتیِ
 *  شفاف و قابل‌تکرار از همان اصول رایج است، نه ادعای انطباق کامل
 *  با یک نسخه‌ی خاص از کتاب.
 */
function estekhraj(question) {
  const malfuzi = normalizeText(question);

  const malbubi = [];
  for (const ch of malfuzi) {
    const spelling = normalizeText(LETTER_SPELLING[ch] || "");
    // بینه: باقیِ حروفِ نام حرف پس از حذفِ اولین وقوعِ خودِ حرف
    const idx = spelling.findIndex((c) => c === ch);
    const rest = idx === -1 ? spelling : spelling.slice(0, idx).concat(spelling.slice(idx + 1));
    malbubi.push(...(rest.length ? rest : spelling));
  }

  const masruri = [...malfuzi].reverse();

  // امتزاج: به‌صورت متناوب از سه ردیف برمی‌داریم
  const combined = [];
  const maxLen = Math.max(malfuzi.length, malbubi.length, masruri.length);
  for (let i = 0; i < maxLen; i++) {
    if (malfuzi[i]) combined.push(malfuzi[i]);
    if (malbubi[i]) combined.push(malbubi[i]);
    if (masruri[i]) combined.push(masruri[i]);
  }

  const total = combined.reduce((s, ch) => s + (ABJAD_VALUES[ch] || 0), 0);

  const khane = clampLetterNumber(total);
  const satr = clampLetterNumber(Math.floor(total / 28));
  const safhe = clampLetterNumber(Math.floor(total / 28 / 28));
  const jozv = clampLetterNumber(Math.floor(total / 28 / 28 / 28));

  const house = getHouse(jozv, safhe, satr, khane);

  return {
    input: question,
    steps: {
      malfuzi: malfuzi.join(" "),
      malbubi: malbubi.join(" "),
      masruri: masruri.join(" "),
      combined: combined.join(" "),
      total,
    },
    address: { jozv, safhe, satr, khane },
    house: house.letters.join(" "),
    houseCombined: house.letters.join(""),
  };
}

/**
 * قاعده‌ی «ملفوظی» (روش دوم استخراج):
 *  ۱. هر حرفِ کلمه/سؤال را با تلفظ/املای کاملش (طبق جدول LETTER_SPELLING) می‌نویسیم
 *     و همه‌ی حروفِ حاصل را پشت سر هم می‌چینیم → این می‌شود «ملفوظی».
 *     مثال: «علی» ← ع=عین، ل=لام، ی=یا ← ملفوظی = ع ی ن ل ا م ی ا
 *  ۲. برای «بینات»: این کار را برای تک‌تکِ حروفِ اصلیِ کلمه جداگانه انجام می‌دهیم —
 *     یعنی از هجیِ هر حرف، فقط حرفِ اولِ خودش (که همیشه با خودش شروع می‌شود) را
 *     حذف می‌کنیم و باقیمانده را نگه می‌داریم، بعد همه‌ی این باقیمانده‌ها را
 *     پشت سر هم می‌چینیم.
 *     مثال: «علی» ← عین−ع=ین ، لام−ل=ام ، یا−ی=ا ← بینات = ی ن ا م ا
 */
function malfuziExpand(word) {
  const letters = normalizeText(word);
  const out = [];
  for (const ch of letters) {
    const spelling = normalizeText(LETTER_SPELLING[ch] || ch);
    out.push(...spelling);
  }
  return out;
}

function binat(word) {
  const letters = normalizeText(word);
  const out = [];
  for (const ch of letters) {
    const spelling = normalizeText(LETTER_SPELLING[ch] || ch);
    out.push(...spelling.slice(1)); // حذفِ حرفِ اولِ هجیِ همین حرف (که خودِ حرف است)
  }
  return out;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function parseIntSafe(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// صادر کردن توابع خالص برای تست و برای استفاده‌ی احتمالی در ابزار «لوح روحانی» بعدی
export {
  ALPHABET, ABJAD_VALUES, normalizeText, getHouse, getPage, computeAbjad, estekhraj,
  malfuziExpand, binat,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/alphabet") {
      return json({ alphabet: ALPHABET, values: ABJAD_VALUES });
    }

    if (url.pathname === "/api/house") {
      const jozv = clampLetterNumber(parseIntSafe(url.searchParams.get("jozv"), 1));
      const safhe = clampLetterNumber(parseIntSafe(url.searchParams.get("safhe"), 1));
      const satr = clampLetterNumber(parseIntSafe(url.searchParams.get("satr"), 1));
      const khane = clampLetterNumber(parseIntSafe(url.searchParams.get("khane"), 1));
      return json(getHouse(jozv, safhe, satr, khane));
    }

    if (url.pathname === "/api/page") {
      const jozv = clampLetterNumber(parseIntSafe(url.searchParams.get("jozv"), 1));
      const safhe = clampLetterNumber(parseIntSafe(url.searchParams.get("safhe"), 1));
      return json(getPage(jozv, safhe));
    }

    if (url.pathname === "/api/locate") {
      const raw = url.searchParams.get("text") || "";
      const letters = normalizeText(raw);
      if (letters.length !== 4) {
        return json({ error: "دقیقاً باید ۴ حرف معتبر از الفبای جفر وارد کنید." }, 400);
      }
      const [j, s, t, k] = letters.map((ch) => LETTER_INDEX.get(ch) + 1);
      return json(getHouse(j, s, t, k));
    }

    if (url.pathname === "/api/abjad" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      return json(computeAbjad(body.text || ""));
    }

    if (url.pathname === "/api/estekhraj" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (!body.question || !normalizeText(body.question).length) {
        return json({ error: "متن سؤال یا اسم را وارد کنید." }, 400);
      }
      return json(estekhraj(body.question));
    }

    // روش دوم: ملفوظی → بینات → مجموع ابجد → جست‌وجوی کلمه‌ی معادل در فرهنگ لغت
    if (url.pathname === "/api/estekhraj2" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const text = body.text || "";
      if (!normalizeText(text).length) {
        return json({ error: "متن سؤال یا اسم را وارد کنید." }, 400);
      }
      const malfuzi = malfuziExpand(text);
      const bin = binat(text);

      // مجموع بینات را به روش ساده‌تر هم محاسبه می‌کنیم: مجموع ابجدِ کل
      // ملفوظی، منهای مجموع ابجدِ خودِ حروف اصلیِ کلمه (چون هر حرف از
      // هجیِ خودش کم شده). هر دو روش باید عدد یکسانی بدهند.
      const wordSum = normalizeText(text).reduce((s, ch) => s + (ABJAD_VALUES[ch] || 0), 0);
      const malfuziSum = malfuzi.reduce((s, ch) => s + (ABJAD_VALUES[ch] || 0), 0);
      const total = malfuziSum - wordSum;

      const words = WORD_INDEX[String(total)] || [];

      return json({
        input: text,
        malfuzi: malfuzi.join(" "),
        binat: bin.join(" "),
        total,
        words,
      });
    }

    // جست‌وجوی مستقیمِ یک عدد در فرهنگ لغت (مستقل از استخراج)
    if (url.pathname === "/api/word-for-number") {
      const number = parseIntSafe(url.searchParams.get("number"), null);
      if (!number) return json({ error: "عدد نامعتبر است." }, 400);
      const words = WORD_INDEX[String(number)] || [];
      return json({ number, words });
    }

    // هر مسیر دیگری → فایل‌های استاتیک (رابط کاربری)
    return env.ASSETS.fetch(request);
  },
};
