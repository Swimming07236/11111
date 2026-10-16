import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBuffer } from 'music-metadata';
import { normalizeMusicMetadata, parseLyricText, embeddedCover, activeLyricIndex, mergeMusicTracks } from '../public/music-metadata.js';
import { taggedMp3, testCover } from './helpers/mp3-fixture.mjs';

test('real ID3v2.2, v2.3 UTF-16 and v2.4 UTF-8 frames yield Chinese title, front cover and embedded LRC', async () => {
  for (const version of [2, 3, 4]) {
    const metadata = await parseBuffer(taggedMp3({ version }), { mimeType: 'audio/mpeg' });
    const info = normalizeMusicMetadata(metadata, 'filename.mp3');
    assert.equal(info.title, '星图之歌');
    assert.equal(info.artist, '测试歌者');
    assert.equal(info.album, '边界来信');
    assert.deepEqual(info.lyrics, { synchronized: true, lines: [{ time: 0, text: '第一行' }, { time: 2, text: '第二行' }] });
    assert.deepEqual(Buffer.from(embeddedCover(metadata).data), testCover);
  }
});

test('embedded SYLT takes precedence over plain lyrics and uses milliseconds as seconds', async () => {
  const metadata = await parseBuffer(taggedMp3({ version: 3, synchronized: true, lyrics: [{ time: 1.25, text: '第一句' }, { time: 2.5, text: '第二句' }] }), { mimeType: 'audio/mpeg' });
  metadata.common.lyrics.unshift({ text: '普通歌词' });
  assert.deepEqual(normalizeMusicMetadata(metadata).lyrics, { synchronized: true, lines: [{ time: 1.25, text: '第一句' }, { time: 2.5, text: '第二句' }] });
});

test('LRC handles repeated and unsorted timestamps, fractional seconds, offsets and translation pairs', () => {
  const lyrics = parseLyricText('[ar:作者]\n[offset:200]\n[00:05][00:01.50]重复句\n[00:01.500]translation\n[00:03.5]一句');
  assert.deepEqual(lyrics.lines, [{ time: 1.3, text: '重复句' }, { time: 1.3, text: 'translation' }, { time: 3.3, text: '一句' }, { time: 4.8, text: '重复句' }]);
  assert.equal(activeLyricIndex(lyrics.lines, 0), -1);
  assert.equal(activeLyricIndex(lyrics.lines, 1.3), 1);
  assert.equal(activeLyricIndex(lyrics.lines, 4), 2);
  assert.equal(activeLyricIndex(lyrics.lines, 1.5), 1);
});

test('plain lyrics remain plain, missing tags use filename, and unsupported covers/frame timing do not create false synchronization', async () => {
  const metadata = await parseBuffer(taggedMp3({ title: null, artist: null, album: null, lyrics: '第一句\n第二句', cover: null }), { mimeType: 'audio/mpeg' });
  const info = normalizeMusicMetadata(metadata, '没有标签.MP3');
  assert.equal(info.title, '没有标签');
  assert.equal(info.lyrics.synchronized, false);
  assert.equal(info.lyrics.lines.length, 2);
  assert.equal(embeddedCover(metadata), null);
  assert.deepEqual(normalizeMusicMetadata({}, 'a.mp3').lyrics.lines, []);
  assert.equal(normalizeMusicMetadata({ common: { lyrics: [{ timeStampFormat: 1, syncText: [{ timestamp: 100, text: 'MPEG frames' }] }] } }).lyrics.synchronized, false);
  assert.equal(embeddedCover({ common: { picture: [{ format: 'image/svg+xml', data: Buffer.from('<svg/>') }] } }), null);
});

test('discovered music is deduplicated with configured paths while manual overrides, order and local listening survive refresh', () => {
  const configured = [{ src: '/assets/music/夜航.mp3', title: '自己起的标题', cover: '/custom.jpg' }];
  const discovered = [{ src: '/assets/music/%E5%A4%9C%E8%88%AA.mp3', title: '内嵌标题', artist: '歌者', lyrics: { synchronized: false, lines: [] }, metadataReady: true }, { src: '/assets/music/100%25.mp3', title: '100%' }];
  const local = [{ src: 'blob:http://localhost/123', file: { name: 'local.mp3' } }];
  const merged = mergeMusicTracks(configured, discovered, local, 'http://localhost/');
  assert.equal(merged.length, 3);
  assert.equal(merged[0].title, '自己起的标题');
  assert.equal(merged[0].cover, '/custom.jpg');
  assert.equal(merged[0].artist, '歌者');
  assert.equal(merged[0].metadataReady, true);
  assert.deepEqual(mergeMusicTracks([], [], local, 'http://localhost/'), local);
});
