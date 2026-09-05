// ---------- Constants from index.js ----------
const ALPHABET = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ی",
  "ک", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق", "ر",
  "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

const ABJAD_VALUES = {
  "ا": 1, "ب": 2, "ج": 3, "د": 4, "ه": 5, "و": 6, "ز": 7, "ح": 8, "ط": 9, "ی": 10,
  "ک": 20, "ل": 30, "م": 40, "ن": 50, "س": 60, "ع": 70, "ف": 80, "ص": 90, "ق": 100, "ر": 200,
  "ش": 300, "ت": 400, "ث": 500, "خ": 600, "ذ": 700, "ض": 800, "ظ": 900, "غ": 1000,
};

const LETTER_SPELLING = {
  "ا": "الف", "ب": "با", "ج": "جیم", "د": "دال", "ه": "ها", "و": "واو", "ز": "زا",
  "ح": "حا", "ط": "طا", "ی": "یا", "ک": "کاف", "ل": "لام", "م": "میم", "ن": "نون",
  "س": "سین", "ع": "عین", "ف": "فا", "ص": "صاد", "ق": "قاف", "ر": "را", "ش": "شین",
  "ت": "تا", "ث": "ثا", "خ": "خا", "ذ": "ذال", "ض": "ضاد", "ظ": "ظا", "غ": "غین",
};

// Helper functions
function computeAbjad(letters) {
  let sum = 0;
  for (const ch of letters) {
    sum += ABJAD_VALUES[ch] || 0;
  }
  return sum;
}

function reduceAbjad(value) {
  while (value > 9) {
    value = String(value).split("").reduce((a, b) => a + parseInt(b), 0);
  }
  return value;
}

function computeBinat(letters) {
  let result = "";
  for (const ch of letters) {
    const spelled = LETTER_SPELLING[ch] || ch;
    result += spelled.slice(1); // Remove first letter
  }
  return result;
}

// ---------- Tabs ----------
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
    panels.forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + tab.dataset.tab).classList.add("active");
  });
});

// ---------- Populate جزء / صفحه selects ----------
const selJozv = document.getElementById("sel-jozv");
const selSafhe = document.getElementById("sel-safhe");
for (let i = 1; i <= 28; i++) {
  selJozv.appendChild(new Option("جزء " + i, i));
  selSafhe.appendChild(new Option("صفحه " + i, i));
}

// ---------- Load a page of the book ----------
async function loadPage() {
  const jozv = selJozv.value;
  const safhe = selSafhe.value;
  const res = await fetch(`/api/page?jozv=${jozv}&safhe=${safhe}`);
  const data = await res.json();

  document.getElementById("page-meta").textContent =
    `جزء ${data.jozv} (${data.jozvLetter}) — صفحه ${data.safhe} (${data.safheLetter})`;

  const table = document.getElementById("jafr-table");
  table.innerHTML = "";
  data.rows.forEach((satrIndex, satrNum) => {
    const tr = document.createElement("tr");
    satrIndex.forEach((cell, khaneNum) => {
      const td = document.createElement("td");
      td.textContent = cell;
      const satr = satrNum + 1;
      const khane = khaneNum + 1;
      
      // Calculate abjad values
      const abjadBig = computeAbjad(cell);
      const abjadSmall = reduceAbjad(abjadBig);
      const binat = computeBinat(cell);
      
      // Create tooltip content with coordinates and values
      const coords = `${jozv}،${safhe}،${satr}،${khane}
ابجد کبیر: ${abjadBig}
ابجد صغیر: ${abjadSmall}
حروف: ${cell}
بینات: ${binat}`;
      
      td.setAttribute("data-coords", coords);
      td.setAttribute("data-jozv", jozv);
      td.setAttribute("data-safhe", safhe);
      td.setAttribute("data-satr", satr);
      td.setAttribute("data-khane", khane);
      td.setAttribute("data-abjad-big", abjadBig);
      td.setAttribute("data-abjad-small", abjadSmall);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
}

document.getElementById("btn-load-page").addEventListener("click", loadPage);
loadPage();

// ---------- Locate a house by typing its 4 letters ----------
document.getElementById("btn-locate").addEventListener("click", async () => {
  const errBox = document.getElementById("locate-error");
  errBox.textContent = "";
  const text = document.getElementById("locate-input").value.trim();
  if (!text) return;

  const res = await fetch(`/api/locate?text=${encodeURIComponent(text)}`);
  const data = await res.json();

  if (data.error) {
    errBox.textContent = data.error;
    return;
  }

  // برو به صفحه‌ی مربوطه
  selJozv.value = data.jozv;
  selSafhe.value = data.safhe;
  await loadPage();

  // آن خانه‌ی مشخص را در جدول برجسته کن
  const table = document.getElementById("jafr-table");
  const row = table.rows[data.satr - 1];
  if (row) {
    const cell = row.cells[data.khane - 1];
    if (cell) {
      table.querySelectorAll("td.cell-highlight").forEach((td) => td.classList.remove("cell-highlight"));
      cell.classList.add("cell-highlight");
      cell.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }
  }

  document.getElementById("page-meta").textContent +=
    ` — رفته به سطر ${data.satr}، خانه ${data.khane}`;
});

// ---------- Single house lookup ----------
document.getElementById("btn-house-lookup").addEventListener("click", async () => {
  const jozv = document.getElementById("hl-jozv").value;
  const safhe = document.getElementById("hl-safhe").value;
  const satr = document.getElementById("hl-satr").value;
  const khane = document.getElementById("hl-khane").value;

  const res = await fetch(`/api/house?jozv=${jozv}&safhe=${safhe}&satr=${satr}&khane=${khane}`);
  const data = await res.json();

  document.getElementById("house-result").innerHTML = `
    <div class="house-big">${data.letters.join(" ")}</div>
    <div class="address-line">جزء ${data.jozv} · صفحه ${data.safhe} · سطر ${data.satr} · خانه ${data.khane}</div>
  `;
});

// ---------- Abjad calculator ----------
document.getElementById("btn-abjad").addEventListener("click", async () => {
  const text = document.getElementById("abjad-input").value.trim();
  const box = document.getElementById("abjad-result");
  if (!text) { box.innerHTML = `<p class="error-msg">متنی وارد کنید.</p>`; return; }

  const res = await fetch("/api/abjad", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();

  if (!data.breakdown.length) {
    box.innerHTML = `<p class="error-msg">هیچ حرف قابل‌شناسایی‌ای در متن پیدا نشد.</p>`;
    return;
  }

  const rows = data.breakdown
    .map((b) => `<tr><td>${b.letter}</td><td>${b.value}</td></tr>`)
    .join("");

  box.innerHTML = `
    <table class="abjad-table">
      <thead><tr><th>حرف</th><th>ارزش ابجد</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total-line">مجموع: ${data.total} — رَدّ به آحاد: ${data.raddeAhad}</div>
  `;
});

// ---------- Estekhraj: method switcher ----------
let estekhrajMethod = "1";
const methodTabs = document.querySelectorAll(".method-tab");
methodTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    methodTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    estekhrajMethod = btn.dataset.method;
    document.getElementById("estekhraj-result").innerHTML = "";
  });
});

document.getElementById("btn-estekhraj").addEventListener("click", async () => {
  const question = document.getElementById("estekhraj-input").value.trim();
  const box = document.getElementById("estekhraj-result");
  if (!question) { box.innerHTML = `<p class="error-msg">سؤال یا اسمی وارد کنید.</p>`; return; }

  if (estekhrajMethod === "1") {
    const res = await fetch("/api/estekhraj", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (data.error) { box.innerHTML = `<p class="error-msg">${data.error}</p>`; return; }

    box.innerHTML = `
      <div class="estekhraj-house">${data.house}</div>
      <div class="address-line">
        جزء ${data.address.jozv} · صفحه ${data.address.safhe} ·
        سطر ${data.address.satr} · خانه ${data.address.khane}
      </div>
      <dl class="steps">
        <dt>ملفوظی (حروفِ متن)</dt><dd>${data.steps.malfuzi || "—"}</dd>
        <dt>ملبوبی (بینه‌ی حروف)</dt><dd>${data.steps.malbubi || "—"}</dd>
        <dt>مسروری (خوانشِ معکوس)</dt><dd>${data.steps.masruri || "—"}</dd>
        <dt>ترکیب نهایی و مجموع ابجد</dt><dd>${data.steps.combined || "—"} — مجموع: ${data.steps.total}</dd>
      </dl>
    `;
    return;
  }

  // روش ۲
  const res = await fetch("/api/estekhraj2", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: question }),
  });
  const data = await res.json();
  if (data.error) { box.innerHTML = `<p class="error-msg">${data.error}</p>`; return; }

  const wordsHtml = data.words.length
    ? data.words.map((w) => `<span class="word-chip">${w}</span>`).join("")
    : `<span class="error-msg">در فرهنگ لغتِ فعلی کلمه‌ای با این عدد پیدا نشد (فهرست را با اسکریپت scripts/build-word-index.mjs کامل کنید).</span>`;

  box.innerHTML = `
    <dl class="steps">
      <dt>ملفوظی</dt><dd>${data.malfuzi || "—"}</dd>
      <dt>بینات (ملفوظی بدون حرف اول)</dt><dd>${data.binat || "—"}</dd>
    </dl>
    <div class="total-line">مجموع ابجدِ بینات: ${data.total}</div>
    <div class="words-found">${wordsHtml}</div>
  `;
});
