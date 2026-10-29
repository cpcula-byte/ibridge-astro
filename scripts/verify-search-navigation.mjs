import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'parse5';
import { searchEntries } from '../src/utils/search-core.mjs';
const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function walk(node, predicate, result = []) {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes || []) walk(child, predicate, result);
  return result;
}
const cache = new Map();
async function documentFor(path) {
  if (!cache.has(path)) cache.set(path, parse(await readFile(join('dist', path, 'index.html'), 'utf8')));
  return cache.get(path);
}
let checked = 0;
for (const path of ['/', '/en/']) {
  const document = await documentFor(path);
  const header = walk(document, n => attr(n, 'data-ibx-header') !== undefined)[0];
  assert(header, `Missing new header: ${path}`);
  assert(walk(header, n => n.tagName === 'img' && /ibridge-header-logo-transparent/.test(attr(n, 'src') || '')).length === 1, 'Transparent logo reference changed');
  for (const anchor of walk(header, n => n.tagName === 'a')) {
    const href = attr(anchor, 'href');
    const url = new URL(href, 'https://ibridge.info');
    const target = await documentFor(url.pathname);
    if (url.hash) assert(walk(target, n => attr(n, 'id') === decodeURIComponent(url.hash.slice(1))).length, `Missing anchor: ${href}`);
    if (url.searchParams.has('family')) assert(walk(target, n => n.tagName === 'option' && attr(n, 'value') === url.searchParams.get('family')).length, `Missing family filter: ${href}`);
    checked++;
  }
}
const index = JSON.parse(await readFile('dist/ib-search-index.json', 'utf8'));
assert(index.length > 20, 'Search index is incomplete');
assert(!index.some(e => /\/(search|thank-you)\/|404/.test(e.url)), 'Utility pages should not be indexed');
assert.equal(new Set(index.map(e => e.url)).size, index.length, 'Duplicate search targets');
for (const entry of index) {
  const url = new URL(entry.url, 'https://ibridge.info');
  const target = await documentFor(url.pathname);
  if (url.hash) assert(walk(target, n => attr(n, 'id') === url.hash.slice(1)).length, `Broken search target: ${entry.url}`);
}
for (const [query, language, target] of [['心理學', 'zh', '/programmes/#programme-psychology-dp'], ['psychology', 'en', '/en/programmes/#programme-psychology-dp'], ['IELTS', 'en', '/en/programmes/#programme-ielts-academic']]) {
  const matches = searchEntries(index, query, language);
  assert(matches.some(e => e.url === target), `Missing search result: ${query}`);
  assert(matches.every(e => e.lang === language), 'Language filter failed');
}
assert.equal(searchEntries(index, 'zzzz-no-match-729846', 'all').length, 0);
assert.equal(searchEntries(index, '   ', 'all').length, 0);
for (const path of ['/search/', '/en/search/']) {
  const document = await documentFor(path);
  assert(walk(document, n => n.tagName === 'meta' && attr(n, 'name') === 'robots' && /noindex/.test(attr(n, 'content'))).length, 'Search page must be noindex');
}
console.log(`✅ 導覽及搜尋檢查通過／Navigation and search checks passed: ${checked} header links, ${index.length} search entries.`);
