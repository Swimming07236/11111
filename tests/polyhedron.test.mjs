import test from 'node:test';
import assert from 'node:assert/strict';
import { createPolyhedron, projectPolyhedron } from '../public/polyhedron.js';

test('the polyhedron forms a connected triangular shell with moderate wire density', () => {
  const { nodes, edges, faces } = createPolyhedron();
  assert.equal(nodes.length, 42);
  assert.equal(edges.length, 120);
  assert.equal(faces.length, 80);
  const visits = new Set([0]);
  for (let pass = 0; pass < nodes.length; pass++) {
    for (const [a, b] of edges) if (visits.has(a) || visits.has(b)) { visits.add(a); visits.add(b); }
  }
  assert.equal(visits.size, nodes.length);
  assert.equal(nodes.length - edges.length + faces.length, 2);
  assert.equal(nodes[0].wave, 0);
  assert.equal(nodes.filter(node => node.wave === 0).length, 1);
  assert.equal(Math.max(...nodes.map(node => node.wave)), 1);
  assert.ok(nodes.every(node => Number.isFinite(node.wave) && node.wave >= 0));
});

test('projection fits desktop/mobile and rotates in depth while reduced motion remains static', () => {
  const model = createPolyhedron();
  for (const [width, height] of [[1280, 720], [390, 844], [740, 390]]) {
    const options = { width, height, time: 3000, motion: true };
    const points = projectPolyhedron(model, options);
    assert.ok(points.every(p => p.x > 0 && p.x < width && p.y > 0 && p.y < height && p.depth >= 0 && p.depth <= 1));
    assert.notDeepEqual(points, projectPolyhedron(model, { ...options, time: 0 }));
    assert.deepEqual(projectPolyhedron(model, { ...options, motion: false }), projectPolyhedron(model, { ...options, time: 0, motion: false }));
  }
});
