import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'parse5';
const walk = (node) => [node, ...(node.childNodes ?? []).flatMap(walk)];
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
for (const [file, prefix] of [['dist/index.html', ''], ['dist/en/index.html', '/en']]) {
  const html = await readFile(file, 'utf8');
  const nodes = walk(parse(html));
  assert.equal(nodes.filter(n => n.tagName === 'h1').length, 1, file + ': one visible headline');
  const heading = nodes.find(n => attr(n, 'id') === 'home-hero-title');
  assert(heading && !attr(heading, 'class')?.includes('sr-only'));
  assert(!html.includes('visual-hero-picture'), file + ': old poster removed');
  const art = nodes.find(n => attr(n, 'src') === '/images/home/ib-bridge-gold-2026.png');
  assert(art && attr(art, 'width') === '1971' && attr(art, 'height') === '798');
  for (const slug of ['contact', 'about']) assert(nodes.some(n => n.tagName === 'a' && attr(n, 'href') === `${prefix}/${slug}/`));
  assert(html.indexOf('home-services') < html.indexOf('home-position'), file + ': services follow hero');
  assert(nodes.some(n => n.tagName === 'form' && attr(n, 'action') === `${prefix}/search/`));
  assert(nodes.some(n => attr(n, 'src')?.startsWith('/images/brand/ibridge-header-logo-transparent.png')));
}
const image = await readFile('dist/images/home/ib-bridge-gold-2026.png');
assert.equal(image.subarray(1, 4).toString(), 'PNG');
assert.equal(image.readUInt32BE(16), 1971);
assert.equal(image.readUInt32BE(20), 798);
assert.equal(image[25], 6, 'Bridge PNG must preserve RGBA transparency');
console.log('✅ 中英文 IB 首頁及透明橋樑檢查通過／Bilingual IB homepage and transparent bridge checks passed.');
