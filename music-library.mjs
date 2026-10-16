import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { parseFile } from 'music-metadata';
import { normalizeMusicMetadata, embeddedCover, metadataOptions } from './public/music-metadata.js';

export function createMusicLibrary(directory) {
  const cache = new Map();

  async function entries() {
    try { return (await readdir(directory, { withFileTypes: true })).filter(entry => entry.isFile() && /\.mp3$/i.test(entry.name)).map(entry => entry.name).sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true })); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }

  async function read(name) {
    const filename = path.join(directory, name);
    const file = await stat(filename);
    const stamp = `${file.mtimeMs}:${file.size}`;
    if (cache.get(name)?.stamp === stamp) return cache.get(name).promise;
    const promise = (async () => {
      try {
        const metadata = await parseFile(filename, metadataOptions);
        return { ...normalizeMusicMetadata(metadata, name), picture: embeddedCover(metadata), metadataError: !metadata.format.codec && !metadata.format.tagTypes?.length };
      } catch {
        return { ...normalizeMusicMetadata({}, name), picture: null, metadataError: true };
      }
    })();
    cache.set(name, { stamp, promise });
    return promise;
  }

  return {
    async list() {
      const names = await entries();
      for (const name of cache.keys()) if (!names.includes(name)) cache.delete(name);
      const tracks = [];
      for (const name of names) {
        try {
          const { picture, ...info } = await read(name);
          tracks.push({ src: `/assets/music/${encodeURIComponent(name)}`, ...info, cover: picture ? `/api/music/cover?file=${encodeURIComponent(name)}&v=${encodeURIComponent(cache.get(name).stamp)}` : '', metadataReady: true });
        } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      return tracks;
    },
    async cover(name) {
      if (typeof name !== 'string' || !(await entries()).includes(name)) return null;
      try { return (await read(name)).picture; }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
  };
}
