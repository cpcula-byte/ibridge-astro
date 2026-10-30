import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'parse5';
const walk = n => [n,...(n.childNodes||[]).flatMap(walk)];
const attr = (n,k) => n.attrs?.find(a=>a.name===k)?.value;
const hasClass = (n,k) => (attr(n,'class')||'').split(/\s+/).includes(k);
async function files(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())out.push(...await files(p));else if(p.endsWith('.html'))out.push(p)}return out}
let count=0;
for(const file of await files('dist')){
 const route=file.slice(4).replace(/index\.html$/,'');
 const nodes=walk(parse(await readFile(file,'utf8'))); const en=route.startsWith('/en/');
 assert.equal(attr(nodes.find(n=>n.tagName==='html'),'lang'),en?'en':'zh-Hant',file+': language');
 assert.equal(nodes.filter(n=>n.tagName==='h1').length,1,file+': one h1');
 assert(nodes.some(n=>n.tagName==='body'&&hasClass(n,'editorial-site')),file+': shared theme');
 const expectedZh=route.replace(/^\/en\//,'/');const is404=route==='/404.html';
 const zh=is404?'/':expectedZh;const eng=is404?'/en/':`/en${expectedZh}`;
 for(const [lang,path] of [['zh-Hant',zh],['en',eng]]){
  const link=nodes.find(n=>n.tagName==='link'&&attr(n,'hreflang')===lang);
  assert.equal(attr(link,'href'),'https://ibridge.info'+path,file+': alternate '+lang);
 }
 const switcher=nodes.find(n=>n.tagName==='a'&&hasClass(n,'ibx-language'));
 assert.equal(attr(switcher,'href'),en?zh:eng,file+': language switch');
 for(const img of nodes.filter(n=>n.tagName==='img')){
  const src=attr(img,'src')?.split('?')[0];if(src?.startsWith('/'))assert((await stat(join('dist',src))).size>0,file+': image '+src);
  assert(attr(img,'alt')!==undefined,file+': image alt');
 }
 if(/\/(search|thank-you)\/$/.test(route))assert(nodes.some(n=>n.tagName==='meta'&&attr(n,'name')==='robots'&&attr(n,'content').includes('noindex')),file+': noindex');
 if(route==='/programmes/'||route==='/en/programmes/')assert.equal(nodes.filter(n=>hasClass(n,'curriculum-card')).length,17);
 if(route==='/resources/'||route==='/en/resources/')assert.equal(nodes.filter(n=>attr(n,'data-resource-card')!==undefined).length,17);
 if(route==='/services/'||route==='/en/services/')assert.equal(nodes.filter(n=>hasClass(n,'editorial-service')).length,6);
 count++;
}
assert.equal(count,25,'Unexpected route count');
assert((await stat('dist/fonts/ibridge-serif-tc.woff2')).size>10000,'Font missing');
// WCAG AA checks for actual text colours on both paper backgrounds.
const linear=v=>{v=parseInt(v,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};
const lum=h=>.2126*linear(h.slice(1,3))+.7152*linear(h.slice(3,5))+.0722*linear(h.slice(5,7));
for(const bg of ['#fbf9f4','#f3efe6'])for(const fg of ['#123353','#536579','#875b2f']){
 const ratio=(lum(bg)+.05)/(lum(fg)+.05);assert(ratio>=4.5,`${fg} on ${bg}: ${ratio}`);
}
assert((lum('#ffffff')+.05)/(lum('#a51c30')+.05)>=4.5);
console.log(`PASS: ${count} pages, language tags, reciprocal language links, assets, catalogue counts and text contrast.`);
