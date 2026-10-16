import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStarDrift, wrapStar } from '../public/star-drift.js';

test('the star field moves continuously without pointer input', () => {
  const drift = createStarDrift({ random: () => .2 });
  drift.update(0);
  let position;
  for (let time = 20; time <= 10000; time += 20) position = drift.update(time);
  assert.ok(Math.abs(Math.hypot(position.x, position.y) - 6.5) < .01);
});

test('randomized headings stay continuous at cycle boundaries', () => {
  const values = [0, .25, 0, .5, 0, .75, 0];
  let index = 0;
  const drift = createStarDrift({ intervalMin: 1000, intervalMax: 1000, random: () => values[index++ % values.length] });
  let previous = drift.update(0);
  let previousVelocity;
  for (let time = 10; time <= 2200; time += 10) {
    const point = drift.update(time);
    const velocity = { x: (point.x - previous.x) / .01, y: (point.y - previous.y) / .01 };
    assert.ok(Math.abs(Math.hypot(velocity.x, velocity.y) - .65) < .00001);
    if (previousVelocity && [1000, 1010, 2000, 2010].includes(time)) {
      assert.ok(Math.hypot(velocity.x - previousVelocity.x, velocity.y - previousVelocity.y) < .002);
    }
    previousVelocity = velocity;
    previous = point;
  }
});

test('reduced motion pauses drift and resuming a hidden page does not jump', () => {
  const drift = createStarDrift({ random: () => .1 });
  drift.update(0);
  const position = drift.update(20);
  assert.deepEqual(drift.update(10000, false), position);
  const resumed = drift.update(900000);
  assert.ok(Math.hypot(resumed.x - position.x, resumed.y - position.y) <= .06501);
  drift.reset();
  assert.deepEqual(drift.update(900010), { x: 0, y: 0 });
});

test('stars wrap beyond the visible edge and remain bounded over long drifts', () => {
  assert.equal(wrapStar(420, 390), 420);
  assert.equal(wrapStar(423, 390), -31);
  for (const value of [-100000, -460, 0, 400, 100000]) {
    const position = wrapStar(value, 390);
    assert.ok(position >= -32 && position < 422);
    assert.equal(wrapStar(value + 454, 390), position);
  }
});
