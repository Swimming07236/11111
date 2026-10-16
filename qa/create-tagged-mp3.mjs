import { taggedMp3 } from '../tests/helpers/mp3-fixture.mjs';
import { writeFile, readFile } from 'node:fs/promises';
const cover = await readFile(new URL('../public/assets/chapters/home-05.png', import.meta.url));
const words = ['光从页边缓缓落下', '我听见星图深处的回声', '每一次靠近，都有新的疆界', '让声音，越过虚与实', '这里保留一小段安静', '下一行，仍然与你同在', '这是内嵌歌词的测试片段', '声音与文字再次相逢'];
await writeFile(new URL('../public/assets/music/00-qa-synced.mp3', import.meta.url), taggedMp3({ title: '星图深处 · 内嵌歌词演示', artist: '测试音轨', album: '虚实疆界', cover, seconds: 90, synchronized: true, lyrics: words.map((text, index) => ({ time: index * 6, text })) }));
await writeFile(new URL('../public/assets/music/01-qa-plain.mp3', import.meta.url), taggedMp3({ title: '静默的页边', artist: '普通歌词测试', cover: null, seconds: 90, lyrics: words.join('\n') }));
await writeFile(new URL('../public/assets/music/02-qa-empty.mp3', import.meta.url), taggedMp3({ title: null, artist: null, album: null, cover: null, lyrics: null, seconds: 90 }));
await writeFile(new URL('./local-listening.mp3', import.meta.url), taggedMp3({ title: '本机 MP3 · 内嵌 LRC 演示', artist: '本地试听', cover, seconds: 90, lyrics: words.map((text, index) => `[00:${String(index * 6).padStart(2, '0')}.00]${text}`).join('\n') }));
