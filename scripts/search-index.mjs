import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

const attr = (node, name) => node.attrs?.find(a => a.name === name)?.value;
function walk(node, predicate, found = []) {
  if (predicate(node)) found.push(node);
  for (const child of node.childNodes || []) walk(child, predicate, found);
  return found;
}
const excluded = new Set(['script', 'style', 'noscript', 'nav', 'form', 'button', 'template']);
function content(node) {
  if (excluded.has(node.tagName) || attr(node, 'aria-hidden') === 'true') return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(content).join(' ');
}
const clean = node => content(node).replace(/\s+/g, ' ').trim();
async function htmlFiles(dir) {
  const found = [];
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, file.name);
    if (file.isDirectory()) found.push(...await htmlFiles(path));
    else if (file.name.endsWith('.html')) found.push(path);
  }
  return found.sort();
}
export async function buildSearchIndex(directory) {
  const entries = [];
  for (const file of await htmlFiles(directory)) {
    const rel = relative(directory, file).replaceAll('\\', '/');
    if (/(^|\/)(404|thank-you|search)(\/|\.html)/.test(rel)) continue;
    const document = parse(await readFile(file, 'utf8'));
    const noindex = walk(document, n => n.tagName === 'meta' && attr(n, 'name') === 'robots').some(n => /noindex/i.test(attr(n, 'content') || ''));
    if (noindex) continue;
    const main = walk(document, n => n.tagName === 'main')[0];
    if (!main) continue;
    const titleNode = walk(document, n => n.tagName === 'title')[0];
    const title = titleNode ? clean(titleNode).replace(/\s*\|\s*iBridge Education$/, '') : rel;
    const url = '/' + rel.replace(/index\.html$/, '');
    const lang = url.startsWith('/en/') ? 'en' : 'zh';
    entries.push({ title, url, lang, text: clean(main) });
    for (const section of walk(main, n => attr(n, 'data-ib-search-section') !== undefined && attr(n, 'id'))) {
      const heading = walk(section, n => /^h[1-6]$/.test(n.tagName || ''))[0];
      if (!heading) continue;
      entries.push({ title: `${clean(heading)} · ${title}`, url: `${url}#${attr(section, 'id')}`, lang, text: clean(section) });
    }
  }
  if (!entries.some(e => e.lang === 'zh') || !entries.some(e => e.lang === 'en')) throw new Error('Search index must include both languages.');
  await writeFile(join(directory, 'ib-search-index.json'), JSON.stringify(entries), 'utf8');
  return entries;
}
export default function siteSearchIndex() {
  let output;
  return {
    name: 'ibridge-site-search',
    hooks: {
      'astro:config:done': ({ config }) => { output = fileURLToPath(config.outDir); },
      'astro:build:done': async ({ dir, logger }) => {
        const entries = await buildSearchIndex(fileURLToPath(dir));
        logger.info(`Search index: ${entries.length} bilingual pages and sections.`);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/ib-search-index.json', async (_request, response) => {
          try {
            const json = await readFile(join(output, 'ib-search-index.json'), 'utf8');
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.setHeader('Cache-Control', 'no-store');
            response.end(json);
          } catch { response.statusCode = 503; response.end('Run npm run build to generate the search index.'); }
        });
      },
    },
  };
}
