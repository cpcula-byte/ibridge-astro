import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';
const probe = createServer();
await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
let port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const child = spawn(process.execPath, [resolve('node_modules/astro/astro.js'), 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
let stopped = false;
let output = '';
child.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-4000).replace(/\u001b\[[0-9;]*m/g, '');
  const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
  if (match) port = Number(match[1]);
});
child.stderr.on('data', chunk => process.stderr.write(chunk));
child.on('error', error => { console.error(error.message); process.exitCode = 1; stopped = true; });
child.on('exit', code => { stopped = true; process.exitCode = code && code !== 130 ? code : 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopped = true; child.kill('SIGTERM'); });
let ready = false;
for (let attempt = 0; attempt < 50 && !stopped; attempt++) {
  await pause(300);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1200) });
    const html = await response.text();
    if (response.ok && html.includes('data-ibx-header')) { ready = true; break; }
  } catch { /* Server is still starting. */ }
}
if (ready) {
  const root = `http://127.0.0.1:${port}`;
  console.log(`\n✅ 本機預覽已就緒／Local preview ready\n繁中：${root}/\nEnglish: ${root}/en/\n搜尋／Search: ${root}/search/?q=IELTS\n\n請保持終端機開啟；完成後按 Control + C。\nKeep Terminal open; press Control + C when finished.\n`);
  if (process.platform === 'darwin') {
    spawn('open', [`${root}/`, `${root}/en/`], { stdio: 'ignore' }).on('error', () => console.log('請手動開啟以上網址／Open the URLs above manually.'));
  }
} else if (!stopped) {
  console.error('❌ 預覽啟動逾時／Preview startup timed out.');
  child.kill('SIGTERM');
  process.exitCode = 1;
}
