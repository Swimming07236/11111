import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createMusicLibrary } from '../music-library.mjs';
import { createApp } from '../server.mjs';
import { taggedMp3, testCover } from './helpers/mp3-fixture.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'music-library-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir()));
    assert.ok(path.basename(directory).startsWith('music-library-'));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

test('music folder discovery supports Chinese filenames, missing tags and malformed files without losing the playlist', async t => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, '01 夜航.MP3'), taggedMp3());
  await writeFile(path.join(directory, '02 无歌词.mp3'), taggedMp3({ title: null, cover: null, lyrics: null }));
  await writeFile(path.join(directory, '03 broken.mp3'), 'not an mp3');
  await writeFile(path.join(directory, 'ignored.txt'), 'private');
  await mkdir(path.join(directory, 'folder.mp3'));
  const library = createMusicLibrary(directory);
  const tracks = await library.list();
  assert.equal(tracks.length, 3);
  assert.equal(tracks[0].title, '星图之歌');
  assert.equal(tracks[0].src, '/assets/music/01%20%E5%A4%9C%E8%88%AA.MP3');
  assert.equal(tracks[0].lyrics.synchronized, true);
  assert.equal(tracks[1].title, '02 无歌词');
  assert.equal(tracks[1].cover, '');
  assert.equal(tracks[1].lyrics.lines.length, 0);
  assert.equal(tracks[2].metadataError, true);
  assert.deepEqual(Buffer.from((await library.cover('01 夜航.MP3')).data), testCover);
  assert.equal(await library.cover('../ignored.txt'), null);
  assert.equal(await library.cover('ignored.txt'), null);
});

test('metadata cache refreshes when MP3 is replaced and tolerates removed or absent folders', async t => {
  const directory = await fixture(t);
  const filename = path.join(directory, 'song.mp3');
  await writeFile(filename, taggedMp3({ title: 'Before' }));
  const library = createMusicLibrary(directory);
  const first = await library.list();
  await writeFile(filename, taggedMp3({ title: 'After: new recording', cover: null, lyrics: '普通歌词' }));
  const later = new Date(Date.now() + 5000);
  await utimes(filename, later, later);
  const second = await library.list();
  assert.equal(first[0].title, 'Before');
  assert.equal(second[0].title, 'After: new recording');
  assert.equal(second[0].lyrics.synchronized, false);
  assert.equal(await library.cover('song.mp3'), null);
  await rm(filename);
  assert.deepEqual(await library.list(), []);
  assert.deepEqual(await createMusicLibrary(path.join(directory, 'absent')).list(), []);
});

test('music API exposes only known cover bytes and never provides a file-upload endpoint', async t => {
  const directory = await fixture(t);
  await writeFile(path.join(directory, 'song.mp3'), taggedMp3());
  const app = createApp({ musicDirectory: directory, works: [] });
  app.listen(0, '127.0.0.1');
  await once(app, 'listening');
  t.after(async () => { app.closeAllConnections(); await new Promise(resolve => app.close(resolve)); });
  const base = `http://127.0.0.1:${app.address().port}`;
  const listing = await fetch(`${base}/api/music`);
  assert.equal(listing.status, 200);
  const { tracks } = await listing.json();
  assert.equal(tracks.length, 1);
  assert.equal(tracks[0].picture, undefined);
  const picture = await fetch(`${base}${tracks[0].cover}`);
  assert.equal(picture.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await picture.arrayBuffer()), testCover);
  for (const file of ['../server.mjs', '/etc/passwd', 'C:\\Windows\\win.ini', 'unknown.mp3', '']) assert.equal((await fetch(`${base}/api/music/cover?file=${encodeURIComponent(file)}`)).status, 404);
  assert.equal((await fetch(`${base}/api/music`, { method: 'POST', body: 'test' })).status, 405);
});
