import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMusicTime } from '../public/music.js';

test('music time labels handle unavailable metadata, long tracks and seek fractions', () => {
  for (const value of [NaN, Infinity, -1, undefined]) assert.equal(formatMusicTime(value), '0:00');
  assert.equal(formatMusicTime(0), '0:00');
  assert.equal(formatMusicTime(61.9), '1:01');
  assert.equal(formatMusicTime(3605), '60:05');
});
