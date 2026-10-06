export const ALPHABET = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ی",
  "ک", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق", "ر",
  "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

export const ABITH_ALPHABET = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص",
  "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ک", "ل", "م", "ن", "ه", "و", "ی",
];

export function getWheelOrder(mode) {
  return mode === "abith" ? ABITH_ALPHABET : ALPHABET;
}

export function normalizeWheelInput(rawText) {
  const unique = [];
  const seen = new Set();

  for (const ch of rawText || "") {
    if (!ALPHABET.includes(ch) || seen.has(ch)) continue;
    seen.add(ch);
    unique.push(ch);
  }

  return unique;
}

export function filterSequenceBySelection(sequence, selectedIndexes) {
  const selected = new Set(selectedIndexes);
  return sequence.filter((ch) => selected.has(ALPHABET.indexOf(ch)));
}
