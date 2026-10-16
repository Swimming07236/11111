export const testCover = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=', 'base64');

export function taggedMp3({ version = 4, title = '星图之歌', artist = '测试歌者', album = '边界来信', lyrics = '[00:00.00]第一行\n[00:02.00]第二行', synchronized = false, cover = testCover, seconds = 4 } = {}) {
  const encoding = version === 4 ? 3 : 1;
  const encode = value => version === 4 ? Buffer.from(value, 'utf8') : Buffer.concat([Buffer.from([255, 254]), Buffer.from(value, 'utf16le')]);
  const zero = Buffer.alloc(encoding === 1 ? 2 : 1);
  const syncsafe = value => Buffer.from([(value >> 21) & 127, (value >> 14) & 127, (value >> 7) & 127, value & 127]);
  const frame = (id, data) => {
    const header = Buffer.alloc(version === 2 ? 6 : 10);
    header.write(id);
    if (version === 2) header.writeUIntBE(data.length, 3, 3);
    else if (version === 4) syncsafe(data.length).copy(header, 4);
    else header.writeUInt32BE(data.length, 4);
    return Buffer.concat([header, data]);
  };
  const text = (id, value) => frame(id, Buffer.concat([Buffer.from([encoding]), encode(value)]));
  const frames = [];
  if (title !== null) frames.push(text(version === 2 ? 'TT2' : 'TIT2', title));
  if (artist !== null) frames.push(text(version === 2 ? 'TP1' : 'TPE1', artist));
  if (album !== null) frames.push(text(version === 2 ? 'TAL' : 'TALB', album));
  if (cover) frames.push(frame(version === 2 ? 'PIC' : 'APIC', Buffer.concat([Buffer.from([encoding]), Buffer.from(version === 2 ? 'PNG' : 'image/png\0'), Buffer.from([3]), encode(''), zero, cover])));
  if (lyrics !== null && synchronized) {
    const pieces = lyrics.map(({ text, time }) => {
      const timestamp = Buffer.alloc(4); timestamp.writeUInt32BE(Math.round(time * 1000));
      return Buffer.concat([encode(text), zero, timestamp]);
    });
    frames.push(frame('SYLT', Buffer.concat([Buffer.from([encoding]), Buffer.from('zho'), Buffer.from([2, 1]), encode(''), zero, ...pieces])));
  } else if (lyrics !== null) frames.push(frame(version === 2 ? 'ULT' : 'USLT', Buffer.concat([Buffer.from([encoding]), Buffer.from('zho'), encode(''), zero, encode(lyrics)])));
  const payload = Buffer.concat(frames);
  const header = Buffer.concat([Buffer.from([73, 68, 51, version, 0, 0]), syncsafe(payload.length)]);
  const audioFrame = Buffer.alloc(417); Buffer.from([255, 251, 144, 100]).copy(audioFrame);
  return Buffer.concat([header, payload, ...Array.from({ length: Math.ceil(seconds * 44100 / 1152) }, () => audioFrame)]);
}
