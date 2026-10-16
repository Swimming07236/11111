import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultTrackIndex, createDefaultMusic, introGainForSanity } from '../public/music-defaults.js';
import { content } from '../public/content.js';

test('intro music grows monotonically from silence at 999 to the user volume at zero and stays there for -1', () => {
  const gain = [999, 900, 600, 300, 50, 0, -1].map(introGainForSanity);
  assert.equal(gain[0], 0);
  assert.equal(gain.at(-1), 1);
  assert.equal(gain.at(-2), 1);
  assert.ok(gain.every((value, index) => index === 0 || value >= gain[index - 1]));
  assert.equal(.35 * introGainForSanity(0), .35);
  assert.equal(.35 * introGainForSanity(999), 0);
});

test('default selection matches complete Unicode filenames and chooses across the full random playlist', () => {
  const tracks = [{ src: '/assets/music/Coldplay%20-%20The%20Scientist.mp3' }, { src: `/assets/music/${encodeURIComponent('塞壬唱片-MSR, Crywolf - Somniomancer [null set].mp3')}` }, { src: 'blob:http://localhost/123', file: { name: 'White Ferrari.mp3' } }];
  assert.equal(defaultTrackIndex(tracks, 'Coldplay - The Scientist.mp3'), 0);
  assert.equal(defaultTrackIndex(tracks, '塞壬唱片-MSR, Crywolf - Somniomancer [null set].mp3'), 1);
  assert.equal(defaultTrackIndex(tracks, 'White Ferrari.mp3'), 2);
  assert.equal(defaultTrackIndex(tracks, 'random', () => 0), 0);
  assert.equal(defaultTrackIndex(tracks, 'random', () => .99999), 2);
  assert.equal(defaultTrackIndex(tracks, 'not found.mp3'), -1);
  assert.equal(defaultTrackIndex([], 'random'), -1);
});

test('a delayed music library plays only the latest chapter request, once, and empty defaults preserve manual playback', () => {
  let ready = false;
  const played = [];
  const missing = [];
  const controller = createDefaultMusic({ defaults: { home: 'random', fiction: 'a.mp3', daily: 'b.mp3', arts: '', bad: 'missing.mp3' }, getTracks: () => [{ src: '/a.mp3' }, { src: '/b.mp3' }], isReady: () => ready, play: index => played.push(index), onMissing: name => missing.push(name), random: () => 0 });
  controller.enter('home'); controller.enter('fiction'); controller.enter('daily');
  assert.deepEqual(played, []);
  ready = true; controller.flush(); controller.flush();
  assert.deepEqual(played, [1]);
  controller.enter('arts'); controller.enter('unknown');
  assert.deepEqual(played, [1]);
  controller.enter('fiction'); controller.enter('fiction');
  assert.deepEqual(played, [1, 0, 0]);
  controller.enter('bad');
  assert.deepEqual(missing, ['missing.mp3']);
  ready = false; controller.enter('home'); controller.reset(); ready = true; controller.flush();
  assert.deepEqual(played, [1, 0, 0]);
});

test('only the initial random choice is configured and chapter requests do not replace it', () => {
  assert.deepEqual(content.musicDefaults, { home: 'random' });
  const played = [];
  const controller = createDefaultMusic({
    defaults: content.musicDefaults,
    getTracks: () => [{ src: '/a.mp3' }, { src: '/b.mp3' }],
    isReady: () => true,
    play: index => played.push(index),
    onMissing: () => assert.fail('Initial music should be available'),
    random: () => .75,
  });
  controller.enter('home');
  for (const chapter of content.navigation) controller.enter(chapter.id);
  controller.flush();
  assert.deepEqual(played, [1]);
});
