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

  const groups = data.groups || { persian: [], arabic: [], names: [] };
  const groupLabels = [
    ["persian", "فارسی"],
    ["arabic", "عربی"],
    ["names", "نام‌ها"],
  ];
  const wordsHtml = groupLabels
    .filter(([key]) => groups[key]?.length)
    .map(([key, label]) => `
      <section class="word-group">
        <h3>${label}</h3>
        <div>${groups[key].map((w) => `<span class="word-chip">${w}</span>`).join("")}</div>
      </section>
    `).join("") ||
    `<span class="error-msg">در فرهنگ لغتِ فعلی کلمه‌ای با این عدد پیدا نشد (فهرست را با اسکریپت scripts/build-word-index.mjs کامل کنید).</span>`;

  box.innerHTML = `
    <dl class="steps">
      <dt>ملفوظی</dt><dd>${data.malfuzi || "—"}</dd>
      <dt>بینات (ملفوظی بدون حرف اول)</dt><dd>${data.binat || "—"}</dd>
    </dl>
    <div class="total-line">مجموع ابجدِ بینات: ${data.total}</div>
    <div class="words-found">${wordsHtml}</div>
  `;
});

// ---------- Alphabet wheel / elemental filters ----------
const ELEMENTS = [
  { name: "آتش", className: "fire" },
  { name: "باد", className: "air" },
  { name: "خاک", className: "earth" },
  { name: "آب", className: "water" },
];
const DIRECTIONS = ["شمال", "شمال‌شرقی", "شرق", "جنوب‌شرقی", "جنوب", "جنوب‌غربی", "غرب"];
const wheel = document.getElementById("letter-wheel");
const wheelSelected = document.getElementById("wheel-selected");
const wheelSummary = document.getElementById("wheel-filter-summary");
const wheelSequence = document.getElementById("wheel-sequence");
const wheelWords = document.getElementById("wheel-words");
const wheelCount = document.getElementById("wheel-selection-count");
const wheelSearch = document.getElementById("wheel-search");
let selectedWheelLetters = new Set();
const activeElements = new Set();
const activeDirections = new Set();

function normalizeWheelInput(rawText) {
  const unique = [];
  const seen = new Set();
  for (const ch of (rawText || "")) {
    if (!ALPHABET.includes(ch)) continue;
    if (seen.has(ch)) continue;
    seen.add(ch);
    unique.push(ch);
  }
  return unique;
}

function getWheelLetterSequence(letters) {
  const valid = letters.filter((ch) => ALPHABET.includes(ch));
  const unique = [...new Set(valid)];
  return unique
    .map((ch) => ALPHABET.indexOf(ch))
    .sort((a, b) => a - b)
    .map((index) => ALPHABET[index]);
}

function polarPoint(cx, cy, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

function sectorPath(innerRadius, outerRadius, startAngle, endAngle) {
  const [x1, y1] = polarPoint(220, 220, outerRadius, startAngle);
  const [x2, y2] = polarPoint(220, 220, outerRadius, endAngle);
  const [x3, y3] = polarPoint(220, 220, innerRadius, endAngle);
  const [x4, y4] = polarPoint(220, 220, innerRadius, startAngle);
  return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
}

function createWheel() {
  const ns = "http://www.w3.org/2000/svg";
  wheel.innerHTML = "";
  const background = document.createElementNS(ns, "circle");
  background.setAttribute("cx", "220");
  background.setAttribute("cy", "220");
  background.setAttribute("r", "204");
  background.setAttribute("class", "wheel-background");
  wheel.appendChild(background);

  for (let ring = 0; ring < 4; ring++) {
    for (let sector = 0; sector < 7; sector++) {
      const index = ring * 7 + sector;
      const startAngle = sector * (360 / 7) + 0.8;
      const endAngle = (sector + 1) * (360 / 7) - 0.8;
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", sectorPath(35 + ring * 42, 75 + ring * 42, startAngle, endAngle));
      path.setAttribute("class", `wheel-cell ${ELEMENTS[ring].className}`);
      path.dataset.index = index;
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `${ALPHABET[index]}، ${ELEMENTS[ring].name}، ${DIRECTIONS[sector]}`);
      path.addEventListener("click", () => toggleWheelLetter(index));
      path.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleWheelLetter(index);
        }
      });
      wheel.appendChild(path);

      const label = document.createElementNS(ns, "text");
      const labelPoint = polarPoint(220, 220, 55 + ring * 42, (startAngle + endAngle) / 2);
      label.setAttribute("x", labelPoint[0]);
      label.setAttribute("y", labelPoint[1] + 7);
      label.setAttribute("class", "wheel-letter");
      label.textContent = ALPHABET[index];
      wheel.appendChild(label);
    }
  }

  const center = document.createElementNS(ns, "text");
  center.setAttribute("x", "220");
  center.setAttribute("y", "216");
  center.setAttribute("class", "wheel-center");
  center.textContent = "ابجد";
  wheel.appendChild(center);
}

function toggleWheelLetter(index) {
  if (selectedWheelLetters.has(index)) selectedWheelLetters.delete(index);
  else selectedWheelLetters.add(index);
  updateWheelSelection();
}

function updateWheelSelection() {
  wheel.querySelectorAll(".wheel-cell").forEach((cell) => {
    const index = Number(cell.dataset.index);
    const element = ELEMENTS[Math.floor(index / 7)];
    const direction = DIRECTIONS[index % 7];
    const selected = selectedWheelLetters.has(Number(cell.dataset.index));
    const matchesElement = !activeElements.size || activeElements.has(element.name);
    const matchesDirection = !activeDirections.size || activeDirections.has(direction);
    const visible = matchesElement && matchesDirection;
    cell.classList.toggle("selected", selected);
    cell.classList.toggle("filtered-out", !visible);
  });
  const indexes = [...selectedWheelLetters];
  wheelCount.textContent = indexes.length ? `${indexes.length} خانه انتخاب شده` : "یک خانه را انتخاب کنید";
  const elementSummary = activeElements.size ? [...activeElements].join("، ") : "همه";
  const directionSummary = activeDirections.size ? [...activeDirections].join("، ") : "همه";
  wheelSummary.textContent = `عنصر: ${elementSummary} · جهت: ${directionSummary}`;

  const textOnlySelection = getWheelLetterSequence(normalizeWheelInput(wheelSearch.value.trim()));
  const sourceIndexes = textOnlySelection.length ? textOnlySelection.map((ch) => ALPHABET.indexOf(ch)) : indexes;

  if (!sourceIndexes.length) {
    wheelSelected.textContent = "هنوز خانه‌ای انتخاب نشده است";
    wheelSequence.textContent = "ترتیبِ گردونه: —";
    wheelWords.innerHTML = `<p class="muted">با انتخاب خانه یا فعال‌کردن فیلترها، خروجی نمایش داده می‌شود.</p>`;
    return;
  }

  const details = sourceIndexes.map((index) => {
    const element = ELEMENTS[Math.floor(index / 7)];
    return `${ALPHABET[index]} · ${element.name} · ${DIRECTIONS[index % 7]}`;
  });
  wheelSelected.textContent = details.join("  |  ");
  wheelSequence.textContent = `ترتیبِ گردونه: ${textOnlySelection.length ? textOnlySelection.join(" ") : sourceIndexes.map((index) => ALPHABET[index]).join(" ")}`;
  loadWheelWords(sourceIndexes, "");
}

async function loadWheelWords(indexes, searchText = "") {
  wheelWords.innerHTML = `<p class="muted">در حال خواندن خروجی…</p>`;
  const results = await Promise.all(indexes.map(async (index) => {
    const value = ABJAD_VALUES[ALPHABET[index]];
    const response = await fetch(`/api/word-for-number?number=${value}`);
    return { letter: ALPHABET[index], value, data: await response.json() };
  }));
  wheelWords.innerHTML = results.map(({ letter, value, data }) => {
    const words = (data.words || []).filter((word) => !searchText || word.includes(searchText));
    return `
    <section class="wheel-word-group">
      <h3>${letter} <small>(${value})</small></h3>
      <div>${words.slice(0, 18).map((word) => `<span class="word-chip">${word}</span>`).join("") || '<span class="muted">واژه‌ای با این ورودی پیدا نشد.</span>'}</div>
    </section>
  `;
  }).join("");
}

document.querySelectorAll(".element-filter").forEach((button) => {
  button.addEventListener("click", () => {
    const element = button.dataset.element;
    if (activeElements.has(element)) activeElements.delete(element);
    else activeElements.add(element);
    selectedWheelLetters = matchingWheelIndexes();
    button.classList.toggle("active", activeElements.has(element));
    updateWheelSelection();
  });
});

document.querySelectorAll(".direction-filter").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.direction;
    if (activeDirections.has(direction)) activeDirections.delete(direction);
    else activeDirections.add(direction);
    selectedWheelLetters = matchingWheelIndexes();
    button.classList.toggle("active", activeDirections.has(direction));
    updateWheelSelection();
  });
});

function matchingWheelIndexes() {
  return new Set(Array.from({ length: 28 }, (_, index) => index).filter((index) => {
    const element = ELEMENTS[Math.floor(index / 7)].name;
    const direction = DIRECTIONS[index % 7];
    return (!activeElements.size || activeElements.has(element)) &&
      (!activeDirections.size || activeDirections.has(direction));
  }));
}

document.getElementById("wheel-clear-filters").addEventListener("click", () => {
  activeElements.clear();
  activeDirections.clear();
  selectedWheelLetters.clear();
  document.querySelectorAll(".element-filter, .direction-filter").forEach((button) => button.classList.remove("active"));
  updateWheelSelection();
});

wheelSearch.addEventListener("input", () => {
  const text = wheelSearch.value.trim();
  const normalized = normalizeWheelInput(text);
  const orderedLetters = getWheelLetterSequence(normalized);

  if (orderedLetters.length) {
    selectedWheelLetters = new Set(orderedLetters.map((ch) => ALPHABET.indexOf(ch)));
    updateWheelSelection();
    return;
  }

  if (selectedWheelLetters.size) {
    loadWheelWords([...selectedWheelLetters], "");
  }
  wheelSelected.textContent = "هنوز خانه‌ای انتخاب نشده است";
  wheelSequence.textContent = "ترتیبِ گردونه: —";
});

createWheel();
updateWheelSelection();
