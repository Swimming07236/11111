import test from 'node:test';
import assert from 'node:assert/strict';
import { sanityAtProgress, sanityDigits, loadingColor, vertexColor, loadingPhase, garbleMessage } from '../public/loading.js';

test('SANITY starts at 999, reaches zero at 90%, and only becomes negative at completion', () => {
  assert.equal(sanityAtProgress(0), 999);
  assert.ok(sanityAtProgress(89.99) > 0);
  assert.equal(sanityAtProgress(90), 0);
  assert.equal(sanityAtProgress(99.99), 0);
  assert.equal(sanityAtProgress(100), -1);
  for (let progress = 1; progress <= 100; progress++) {
    assert.ok(sanityAtProgress(progress) <= sanityAtProgress(progress - 1));
  }
});

test('the countdown slows and loses magnitude digits without counting the minus sign', () => {
  const earlyDrop = sanityAtProgress(0) - sanityAtProgress(10);
  const middleDrop = sanityAtProgress(40) - sanityAtProgress(50);
  const lateDrop = sanityAtProgress(80) - sanityAtProgress(90);
  assert.ok(earlyDrop > middleDrop && middleDrop > lateDrop);
  assert.deepEqual([999, 100, 99, 10, 9, 0, -1].map(sanityDigits), [3, 3, 2, 2, 1, 1, 1]);
});

test('loading colors interpolate from lit yellow to white, with four copy stages and changing garble', () => {
  assert.deepEqual(loadingColor(0), [242, 213, 55]);
  assert.deepEqual(loadingColor(100), [239, 244, 244]);
  assert.ok(loadingColor(50)[2] > loadingColor(0)[2]);
  assert.deepEqual([0, 24.99, 25, 50, 75, 100].map(p => loadingPhase(p, 4)), [0, 0, 1, 2, 3, 3]);
  assert.equal(garbleMessage(20), garbleMessage(20));
  assert.notEqual(garbleMessage(20), garbleMessage(21));
  assert.equal(garbleMessage(20).length, 21);
});

test('white spreads from one mesh corner while distant vertices remain yellow', () => {
  assert.deepEqual(vertexColor(0, 0), loadingColor(0));
  assert.deepEqual(vertexColor(50, 0), loadingColor(100));
  assert.deepEqual(vertexColor(50, 1), loadingColor(0));
  assert.notDeepEqual(vertexColor(50, .5), loadingColor(0));
  for (const distance of [0, .25, .5, .75, 1]) assert.deepEqual(vertexColor(100, distance), loadingColor(100));
});
