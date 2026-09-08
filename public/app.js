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

function uniqueLetters(text) {
  return [...new Set(text)];
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
      const uniqueBinat = uniqueLetters(binat).join("");
      const uniqueBinatAbjad = computeAbjad(uniqueBinat);
      
      // Create tooltip content with coordinates and values
      const coords = `جزء (اقلیم): ${jozv}
    صفحه (شهر): ${safhe}
    سطر (کوی/محله): ${satr}
    خانه (بیت): ${khane}
    حروف: ${cell} — ابجد کبیر: ${abjadBig}
    بینات: ${binat} — ابجد کبیر: ${computeAbjad(binat)}
    بیناتِ بدون تکرار: ${uniqueBinat} — ابجد کبیر: ${uniqueBinatAbjad}`;
      
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
  { name: "آب", className: "water" },
  { name: "خاک", className: "earth" },
];
const DIRECTIONS = ["شمال", "شمال‌شرقی", "شرق", "جنوب‌شرقی", "جنوب", "جنوب‌غربی", "غرب"];
const ABITH_GROUPS = [
  { name: "آتش", direction: "شرق", className: "fire", letters: ["ا", "ج", "ذ", "ش", "ض", "ع", "ک"] },
  { name: "باد", direction: "غرب", className: "air", letters: ["ب", "ح", "ر", "ص", "ط", "غ", "ل"] },
  { name: "آب", direction: "شمال", className: "water", letters: ["ت", "خ", "ز", "ض", "ظ", "ف", "م"] },
  { name: "خاک", direction: "جنوب", className: "earth", letters: ["ث", "د", "س", "ط", "ق", "ن", "و", "ه", "ی"] },
];
const modeButtons = document.querySelectorAll(".mode-button");
let currentWheelMode = "abjad";
const wheel = document.getElementById("letter-wheel");
const wheelSelected = document.getElementById("wheel-selected");
const wheelSequence = document.getElementById("wheel-sequence");
const wheelWords = document.getElementById("wheel-words");
const wheelCount = document.getElementById("wheel-selection-count");
const wheelSearch = document.getElementById("wheel-search");
const numberSelection = document.getElementById("number-selection");
const viewButtons = document.querySelectorAll(".view-button");
let selectedWheelLetters = new Set();
const activeElements = new Set();
const activeDirections = new Set();
let mouseIsDown = false;
let currentWheelView = "circle";

function normalizeWheelInputSafe(rawText) {
  const unique = [];
  const seen = new Set();
  for (const ch of (rawText || "")) {
    if (!ALPHABET.includes(ch) || seen.has(ch)) continue;
    seen.add(ch);
    unique.push(ch);
  }
  return unique;
}

function getWheelLetterSequence(letters) {
  return normalizeWheelInputSafe(Array.isArray(letters) ? letters.join("") : String(letters || ""));
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

function getWheelMeta(index) {
  if (currentWheelMode === "abith") {
    const letter = ALPHABET[index];
    const group = ABITH_GROUPS.find((item) => item.letters.includes(letter));
    if (group) {
      return {
        element: group.name,
        className: group.className,
        direction: group.direction,
        letter,
      };
    }
    return { element: "آتش", className: "fire", direction: "شرق", letter };
  }

  const ring = Math.floor(index / 7);
  const element = ELEMENTS[3 - ring];
  const direction = DIRECTIONS[index % 7];
  return {
    element: element.name,
    className: element.className,
    direction,
    letter: ALPHABET[index],
  };
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
      const meta = getWheelMeta(index);
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", sectorPath(35 + ring * 42, 75 + ring * 42, startAngle, endAngle));
      path.setAttribute("class", `wheel-cell ${meta.className}`);
      path.dataset.index = index;
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `${meta.letter}، ${meta.element}، ${meta.direction}`);
      path.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        mouseIsDown = true;
        toggleWheelLetter(index);
      });
      path.addEventListener("pointerenter", () => {
        if (mouseIsDown) toggleWheelLetter(index);
      });
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
      label.textContent = meta.letter;
      wheel.appendChild(label);
    }
  }

  const center = document.createElementNS(ns, "text");
  center.setAttribute("x", "220");
  center.setAttribute("y", "216");
  center.setAttribute("class", "wheel-center");
  center.textContent = "ابجد";
  wheel.appendChild(center);
  createNumberSelection();
}

function createNumberSelection() {
  numberSelection.innerHTML = "";
  for (let index = 0; index < 28; index++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-cell";
    button.dataset.index = index;
    button.textContent = String(index + 1);
    button.title = `${index + 1}: ${ALPHABET[index]}`;
    button.setAttribute("aria-label", `${index + 1}، ${ALPHABET[index]}`);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      mouseIsDown = true;
      toggleWheelLetter(index);
    });
    button.addEventListener("pointerenter", () => {
      if (mouseIsDown) toggleWheelLetter(index);
    });
    numberSelection.appendChild(button);
  }
  updateNumberSelection();
}

function updateNumberSelection() {
  numberSelection.querySelectorAll(".number-cell").forEach((button) => {
    const index = Number(button.dataset.index);
    const meta = getWheelMeta(index);
    const visible = (!activeElements.size || activeElements.has(meta.element)) &&
      (!activeDirections.size || activeDirections.has(meta.direction));
    const selected = selectedWheelLetters.has(index);
    button.classList.toggle("selected", selected);
    button.classList.toggle("filtered-out", !visible && !selected);
  });
}

function toggleWheelLetter(index) {
  if (selectedWheelLetters.has(index)) selectedWheelLetters.delete(index);
  else selectedWheelLetters.add(index);
  updateWheelSelection();
}

window.addEventListener("pointerup", () => {
  mouseIsDown = false;
});
window.addEventListener("pointerleave", () => {
  mouseIsDown = false;
});

function updateWheelSelection() {
  wheel.querySelectorAll(".wheel-cell").forEach((cell) => {
    const index = Number(cell.dataset.index);
    const meta = getWheelMeta(index);
    const selected = selectedWheelLetters.has(index);
    const matchesElement = !activeElements.size || activeElements.has(meta.element);
    const matchesDirection = !activeDirections.size || activeDirections.has(meta.direction);
    const visible = matchesElement && matchesDirection;
    cell.classList.toggle("selected", selected);
    cell.classList.toggle("filtered-out", !visible && !selected);
  });
  updateNumberSelection();

  const indexes = [...selectedWheelLetters];
  wheelCount.textContent = indexes.length ? `${indexes.length} خانه روشن` : "هیچ خانه‌ای روشن نیست";

  const rawInput = wheelSearch.value.trim();
  const inputLetters = rawInput ? getWheelLetterSequence(rawInput) : [];
  const filteredSequence = inputLetters.filter((ch) => selectedWheelLetters.has(ALPHABET.indexOf(ch)));

  if (!filteredSequence.length) {
    wheelSelected.textContent = "هنوز ورودیِ فیلترشده‌ای باقی نمانده است";
    wheelSequence.textContent = "ترتیبِ فیلترشده: —";
    wheelWords.hidden = true;
    return;
  }

  wheelSelected.textContent = filteredSequence.join(" ");
  wheelSequence.textContent = `ترتیبِ فیلترشده: ${filteredSequence.join(" ")}`;
  wheelWords.hidden = true;
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
    const meta = getWheelMeta(index);
    return (!activeElements.size || activeElements.has(meta.element)) &&
      (!activeDirections.size || activeDirections.has(meta.direction));
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
  updateWheelSelection();
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentWheelMode = button.dataset.mode;
    modeButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    activeElements.clear();
    activeDirections.clear();
    selectedWheelLetters.clear();
    document.querySelectorAll(".element-filter, .direction-filter").forEach((el) => el.classList.remove("active"));
    createWheel();
    updateWheelSelection();
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentWheelView = button.dataset.view;
    viewButtons.forEach((item) => item.classList.toggle("active", item === button));
    wheel.hidden = currentWheelView !== "circle";
    numberSelection.hidden = currentWheelView !== "numbers";
  });
});

createWheel();
updateWheelSelection();
