export const ALPHABET = [
  "ا", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ی",
  "ک", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق", "ر",
  "ش", "ت", "ث", "خ", "ذ", "ض", "ظ", "غ",
];

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
