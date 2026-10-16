import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const destination = new URL('../public/vendor/', import.meta.url);
await mkdir(destination, { recursive: true });
const result = await build({ stdin: { contents: "export { parseBlob } from 'music-metadata';", resolveDir: fileURLToPath(new URL('..', import.meta.url)) }, bundle: true, platform: 'browser', format: 'esm', target: 'es2022', minify: true, legalComments: 'inline', write: false });
await writeFile(new URL('music-metadata.js', destination), result.outputFiles[0].contents);
const packages = ['music-metadata', '@borewit/text-codec', 'content-type', 'debug', 'file-type', 'ieee754', 'media-typer', 'ms', 'strtok3', 'token-types', 'uint8array-extras', '@tokenizer/token', '@tokenizer/inflate', 'win-guid'];
const licenses = [];
for (const name of packages) {
  for (const file of ['LICENSE', 'LICENSE.txt', 'license', 'license.md']) {
    try { licenses.push(`${name}\n${await readFile(new URL(`../node_modules/${name}/${file}`, import.meta.url), 'utf8')}`); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
await writeFile(new URL('music-metadata-LICENSE.txt', destination), licenses.join('\n\n---\n\n'));
console.log(`Local music parser: ${Math.round(result.outputFiles[0].contents.length / 1024)} KiB`);
