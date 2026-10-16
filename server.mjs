import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { content } from './public/content.js';
import { createMusicLibrary } from './music-library.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/ogg',
};

function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match || !match[1] && !match[2]) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const requestedEnd = match[1] && match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start >= size || requestedEnd < start) return false;
  return { start, end: Math.min(requestedEnd, size - 1) };
}

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let size = 0;
  let tooLarge = false;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) tooLarge = true;
    else chunks.push(chunk);
  }
  if (tooLarge) throw Object.assign(new Error('留言内容太长了。'), { status: 413 });
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('留言格式不正确。'), { status: 400 }); }
}

export function createApp({ dataFile = path.join(root, 'data', 'comments.json'), works = content.works, musicDirectory = path.join(publicRoot, 'assets', 'music') } = {}) {
  const music = createMusicLibrary(musicDirectory);
  let writeQueue = Promise.resolve();
  async function readComments() {
    try { return JSON.parse(await readFile(dataFile, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  }
  function appendComment(workId, comment) {
    const operation = writeQueue.then(async () => {
      const records = await readComments();
      records[workId] = [...(records[workId] || []), comment];
      await mkdir(path.dirname(dataFile), { recursive: true });
      const temporaryFile = `${dataFile}.tmp`;
      await writeFile(temporaryFile, JSON.stringify(records, null, 2), 'utf8');
      await rename(temporaryFile, dataFile);
      return records[workId];
    });
    writeQueue = operation.catch(() => {});
    return operation;
  }

  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/api/music' || url.pathname === '/api/music/cover') {
        if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: '不支持这个操作。' });
        if (url.pathname === '/api/music') {
          const tracks = await music.list();
          if (request.method === 'HEAD') { response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); return response.end(); }
          return json(response, 200, { tracks });
        }
        const picture = await music.cover(url.searchParams.get('file'));
        if (!picture) return json(response, 404, { error: '这首音乐没有内嵌封面。' });
        response.writeHead(200, { 'Content-Type': picture.format, 'Content-Length': picture.data.length, 'Cache-Control': 'no-cache' });
        return response.end(request.method === 'HEAD' ? undefined : picture.data);
      }
      const apiMatch = url.pathname.match(/^\/api\/comments\/([a-z0-9-]+)$/);
      if (apiMatch) {
        const work = works.find(item => item.id === apiMatch[1]);
        if (!work) return json(response, 404, { error: '没有找到这篇作品。' });
        if (!work.commentsEnabled) return json(response, 403, { error: '这篇作品暂未开放留言。' });
        if (request.method === 'GET') {
          await writeQueue;
          const records = await readComments();
          return json(response, 200, { comments: records[work.id] || [] });
        }
        if (request.method === 'POST') {
          const body = await readBody(request);
          const name = typeof body?.name === 'string' ? body.name.trim() : '';
          const message = typeof body?.message === 'string' ? body.message.trim() : '';
          if (!name || name.length > 40 || !message || message.length > 2000) {
            return json(response, 400, { error: '请输入 1–40 字的名称和 1–2000 字的留言。' });
          }
          const comment = { id: randomUUID(), name, message, createdAt: new Date().toISOString() };
          const comments = await appendComment(work.id, comment);
          return json(response, 201, { comment, comments });
        }
        response.setHeader('Allow', 'GET, POST');
        return json(response, 405, { error: '不支持这个操作。' });
      }
      if (url.pathname.startsWith('/api/')) return json(response, 404, { error: '没有找到这个接口。' });
      if (!['GET', 'HEAD'].includes(request.method)) return json(response, 405, { error: '不支持这个操作。' });
      const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const filename = path.resolve(publicRoot, `.${pathname}`);
      if (!filename.startsWith(`${publicRoot}${path.sep}`)) return json(response, 403, { error: '无法访问这个文件。' });
      try {
        const file = await stat(filename);
        if (!file.isFile()) return json(response, 404, { error: '没有找到这个文件。' });
        const range = request.method === 'HEAD' ? null : byteRange(request.headers.range, file.size);
        const headers = { 'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
        if (range === false) {
          response.writeHead(416, { ...headers, 'Content-Range': `bytes */${file.size}`, 'Content-Length': 0 });
          return response.end();
        }
        if (range) headers['Content-Range'] = `bytes ${range.start}-${range.end}/${file.size}`;
        headers['Content-Length'] = range ? range.end - range.start + 1 : file.size;
        response.writeHead(range ? 206 : 200, headers);
        if (request.method === 'HEAD' || file.size === 0) return response.end();
        const stream = createReadStream(filename, range || undefined);
        stream.on('error', error => response.destroy(error));
        response.on('close', () => stream.destroy());
        stream.pipe(response);
      } catch (error) {
        if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return json(response, 404, { error: '没有找到这个文件。' });
        throw error;
      }
    } catch (error) {
      const status = error.status || (error instanceof URIError ? 400 : 500);
      if (status === 500) console.error(error);
      json(response, status, { error: status === 500 ? '暂时无法保存，请稍后再试。' : error.message });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || '127.0.0.1';
  const app = createApp();
  app.listen(port, host, () => {
    const localUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`;
    console.log(`${content.title} · Local: ${localUrl}`);
    if (process.argv.includes('--open') && process.platform === 'win32') {
      const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', localUrl], { detached: true, stdio: 'ignore', windowsHide: true });
      browser.on('error', () => console.log('请在浏览器中打开上方本地地址。'));
      browser.unref();
    }
  });
  app.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被占用，请更换 PORT 或关闭已有预览。` : error.message);
    process.exitCode = 1;
  });
}
