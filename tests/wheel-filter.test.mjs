import assert from 'node:assert/strict';
import { ABITH_ALPHABET, ALPHABET, filterSequenceBySelection, getWheelOrder, normalizeWheelInput } from '../public/wheel-core.js';

assert.deepEqual(normalizeWheelInput('ببجببا'), ['ب', 'ج', 'ا']);
assert.deepEqual(getWheelOrder('abjad'), ALPHABET);
assert.deepEqual(getWheelOrder('abith'), ABITH_ALPHABET);
assert.equal(new Set(ABITH_ALPHABET).size, 28);
assert.deepEqual(ABITH_ALPHABET, [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص',
  'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'ل', 'م', 'ن', 'ه', 'و', 'ی',
]);
assert.deepEqual(filterSequenceBySelection(['ب', 'ج', 'ا'], [ALPHABET.indexOf('ب'), ALPHABET.indexOf('ا')]), ['ب', 'ا']);
assert.deepEqual(filterSequenceBySelection(['ا', 'ب', 'س', 'ی'], [ALPHABET.indexOf('ب'), ALPHABET.indexOf('س')]), ['ب', 'س']);
assert.deepEqual(filterSequenceBySelection(['ب', 'ب', 'ج', 'ب', 'ا'], [ALPHABET.indexOf('ب'), ALPHABET.indexOf('ا')]), ['ب', 'ب', 'ب', 'ا']);

console.log('wheel-filter tests passed');
