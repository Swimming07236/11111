import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server.mjs';

async function fixture(t, dataFile) {
  const directory = dataFile ? null : await mkdtemp(path.join(tmpdir(), 'personal-gallery-'));
  const file = dataFile || path.join(directory, 'comments.json');
  const app = createApp({ dataFile: file, works: [{ id: 'enabled-work', commentsEnabled: true }, { id: 'disabled-work', commentsEnabled: false }] });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(async () => {
    app.closeAllConnections();
    await new Promise(resolve => app.close(resolve));
    if (directory) {
      assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
      assert.ok(path.basename(directory).startsWith('personal-gallery-'));
      await rm(directory, { recursive: true, force: true });
    }
  });
  const base = `http://127.0.0.1:${app.address().port}`;
  const post = (body, id = 'enabled-work') => fetch(`${base}/api/comments/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { app, base, file, post };
}

test('comments remain shared and survive a server restart', async t => {
  const first = await fixture(t);
  const response = await first.post({ name: '  测试访客  ', message: '  一点回声\n第二行  ' });
  assert.equal(response.status, 201);
  const { comment } = await response.json();
  assert.equal(comment.name, '测试访客');
  assert.equal(comment.message, '一点回声\n第二行');
  assert.ok(comment.id);
  assert.ok(Number.isFinite(Date.parse(comment.createdAt)));
  first.app.closeAllConnections();
  await new Promise(resolve => first.app.close(resolve));
  const restarted = await fixture(t, first.file);
  const result = await fetch(`${restarted.base}/api/comments/enabled-work`).then(response => response.json());
  assert.deepEqual(result.comments, [comment]);
});

test('simultaneous visitors do not overwrite one another', async t => {
  const { post, base, file } = await fixture(t);
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => post({ name: `访客${index}`, message: `内容${index}` })));
  assert.ok(responses.every(response => response.status === 201));
  const result = await fetch(`${base}/api/comments/enabled-work`).then(response => response.json());
  assert.equal(result.comments.length, 12);
  assert.equal(new Set(result.comments.map(comment => comment.id)).size, 12);
  const persisted = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(persisted['enabled-work'].length, 12);
});

test('anonymous input is validated and HTML is stored as plain content', async t => {
  const { post, base } = await fixture(t);
  for (const body of [null, {}, { name: ' ', message: 'x' }, { name: 'x', message: ' ' }, { name: 'x'.repeat(41), message: 'x' }, { name: 'x', message: 'x'.repeat(2001) }, { name: 3, message: [] }]) {
    assert.equal((await post(body)).status, 400);
  }
  const markup = '<img src=x onerror=alert(1)>';
  assert.equal((await post({ name: '<script>bad()</script>', message: markup })).status, 201);
  const result = await fetch(`${base}/api/comments/enabled-work`).then(response => response.json());
  assert.equal(result.comments[0].message, markup);
  const malformed = await fetch(`${base}/api/comments/enabled-work`, { method: 'POST', body: '{' });
  assert.equal(malformed.status, 400);
  const oversized = await fetch(`${base}/api/comments/enabled-work`, { method: 'POST', body: 'x'.repeat(20000) });
  assert.equal(oversized.status, 413);
});

test('unknown and disabled works cannot receive or disclose comments', async t => {
  const { post, base } = await fixture(t);
  assert.equal((await post({ name: 'x', message: 'y' }, 'unknown')).status, 404);
  assert.equal((await post({ name: 'x', message: 'y' }, 'disabled-work')).status, 403);
  assert.equal((await fetch(`${base}/api/comments/disabled-work`)).status, 403);
  assert.equal((await fetch(`${base}/api/comments/enabled-work`, { method: 'DELETE' })).status, 405);
});

test('only public assets can be served', async t => {
  const { base } = await fixture(t);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(await page.text(), /<title>虚实疆界/);
  assert.equal((await fetch(`${base}/assets/mountain.svg`)).status, 200);
  assert.equal((await fetch(`${base}/assets/fonts/calligraphy.woff2`)).status, 200);
  for (const filename of ['/server.mjs', '/data/comments.json', '/package.json', '/..%2fserver.mjs', '/%2e%2e%5cserver.mjs']) {
    assert.ok([403, 404].includes((await fetch(`${base}${filename}`)).status));
  }
});

test('audio supports full playback, seeking, suffix ranges and HEAD without a body', async t => {
  const { base } = await fixture(t);
  const name = `music-test-${randomUUID()}.wav`;
  const filename = fileURLToPath(new URL(`../public/${name}`, import.meta.url));
  const bytes = Buffer.from('RIFF-test-audio-data-0123456789');
  await writeFile(filename, bytes);
  t.after(() => unlink(filename));
  const full = await fetch(`${base}/${name}`);
  assert.equal(full.status, 200);
  assert.equal(full.headers.get('content-type'), 'audio/wav');
  assert.equal(full.headers.get('accept-ranges'), 'bytes');
  assert.equal(Number(full.headers.get('content-length')), bytes.length);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
  for (const [range, start, end] of [['bytes=3-10', 3, 10], ['bytes=8-', 8, bytes.length - 1], ['bytes=-5', bytes.length - 5, bytes.length - 1], ['bytes=0-99999', 0, bytes.length - 1]]) {
    const part = await fetch(`${base}/${name}`, { headers: { Range: range } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get('content-range'), `bytes ${start}-${end}/${bytes.length}`);
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), bytes.subarray(start, end + 1));
  }
  const head = await fetch(`${base}/${name}`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(Number(head.headers.get('content-length')), bytes.length);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});

test('unsatisfiable audio ranges return 416 and unsupported range forms fall back to the complete file', async t => {
  const { base } = await fixture(t);
  const url = `${base}/assets/music-cover.svg`;
  const bytes = await readFile(new URL('../public/assets/music-cover.svg', import.meta.url));
  for (const range of ['bytes=999999-', 'bytes=10-2', 'bytes=-0']) {
    const response = await fetch(url, { headers: { Range: range } });
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('content-range'), `bytes */${bytes.length}`);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  for (const range of ['bytes=0-1,5-6', 'invalid']) {
    const response = await fetch(url, { headers: { Range: range } });
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
  }
});
