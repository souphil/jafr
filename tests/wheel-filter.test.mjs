import assert from 'node:assert/strict';
import { ALPHABET, filterSequenceBySelection, normalizeWheelInput } from '../public/wheel-core.js';

assert.deepEqual(normalizeWheelInput('ببجببا'), ['ب', 'ج', 'ا']);
assert.deepEqual(filterSequenceBySelection(['ب', 'ج', 'ا'], [ALPHABET.indexOf('ب'), ALPHABET.indexOf('ا')]), ['ب', 'ا']);
assert.deepEqual(filterSequenceBySelection(['ا', 'ب', 'س', 'ی'], [ALPHABET.indexOf('ب'), ALPHABET.indexOf('س')]), ['ب', 'س']);

console.log('wheel-filter tests passed');
