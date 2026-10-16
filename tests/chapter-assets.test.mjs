import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { content } from '../public/content.js';

test('home and ordered chapters retain the requested category mapping', () => {
  assert.equal(content.title, '虚实疆界');
  assert.equal(content.home.label, '玻利瓦尔肤层');
  assert.deepEqual(content.navigation.map(item => [item.id, item.label]), [
    ['fiction', '甜美的伤口'], ['science-fiction', '血色空脉'], ['arts', '受害者腐殖'], ['daily', '卡德霍之颅'],
  ]);
  assert.equal(content.works.filter(work => work.category === 'home').length, 0);
  assert.ok(content.works.every(work => content.navigation.some(item => item.id === work.category)));
});

test('all five original PPT chapter scenes have resolvable cropped assets and finite transforms', async () => {
  const scenes = JSON.parse(await readFile(new URL('../public/assets/chapters/scenes.json', import.meta.url), 'utf8'));
  for (const [id, slide] of [['home', 4], ['fiction', 9], ['science-fiction', 14], ['arts', 18], ['daily', 21]]) {
    const scene = scenes[id];
    assert.equal(scene.slide, slide);
    assert.ok(scene.layers.length >= 8);
    for (const layer of scene.layers) {
      assert.equal(layer.matrix.length, 6);
      assert.ok(layer.matrix.every(Number.isFinite));
      assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
      await access(new URL(`../public${layer.src}`, import.meta.url));
    }
  }
});
