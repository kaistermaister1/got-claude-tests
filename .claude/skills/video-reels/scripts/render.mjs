#!/usr/bin/env node
// Deterministic HTML -> video renderer for the video-reels skill.
// The page must expose window.__seek(t), window.__duration and (optionally) window.__ready.
//
//   node render.mjs page.html --out reel.mp4 [--fps 30 --width 1080 --height 1920 --crf 18]
//   node render.mjs page.html --sheet sheet.png [--count 16]
//   node render.mjs page.html --at 0,2.5,7 --stills dir/
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) {
    try { return require(p); } catch {}
  }
  throw new Error('playwright not found');
}
const { chromium } = loadPlaywright();

const argv = process.argv.slice(2);
const page_ = argv.find((a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--'));
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
if (!page_) { console.error('usage: render.mjs page.html --out x.mp4 | --sheet x.png | --at t1,t2 --stills dir'); process.exit(1); }

const fps = Number(opt('fps', 30));
const width = Number(opt('width', 1080));
const height = Number(opt('height', 1920));
const crf = String(opt('crf', 18));

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  return { stdin: p.stdin, done };
}
const write = (stream, buf) => new Promise((res) => (stream.write(buf) ? res() : stream.once('drain', res)));

let browser;
try { browser = await chromium.launch(); }
catch (e) { if (!existsSync('/opt/pw-browsers/chromium')) throw e; browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(page_)).href, { waitUntil: 'load' });
await page.evaluate(async () => { if (window.__ready) await window.__ready; await document.fonts.ready; });
const duration = Number(opt('duration', await page.evaluate(() => window.__duration)));
if (!duration) throw new Error('page did not set window.__duration');

async function frameAt(t) {
  await page.evaluate((tt) => window.__seek(tt), t);
  return page.screenshot({ type: 'png' });
}

if (opt('out')) {
  const out = opt('out');
  const total = Math.round(duration * fps);
  const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', crf,
    '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', out]);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await write(ff.stdin, await frameAt(i / fps));
    if (i % fps === 0) process.stdout.write(`\rframe ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await ff.done;
  console.log(`\nwrote ${out} (${total} frames, ${duration}s @ ${fps}fps)`);
}

if (opt('sheet')) {
  const n = Number(opt('count', 16));
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const tw = 270, th = Math.round((270 * height) / width);
  const ff = ffmpeg(['-f', 'image2pipe', '-i', '-', '-vf', `scale=${tw}:${th},tile=${cols}x${rows}:padding=6:color=gray`, '-frames:v', '1', opt('sheet')]);
  for (let i = 0; i < n; i++) await write(ff.stdin, await frameAt((duration * (i + 0.5)) / n));
  ff.stdin.end();
  await ff.done;
  console.log(`wrote ${opt('sheet')} (${n} frames at ((i+0.5)/${n})*${duration}s)`);
}

if (opt('at')) {
  const dir = opt('stills', 'stills');
  mkdirSync(dir, { recursive: true });
  for (const t of opt('at').split(',').map(Number)) {
    await page.evaluate((tt) => window.__seek(tt), t);
    const f = path.join(dir, `t${t.toFixed(2)}.png`);
    await page.screenshot({ path: f });
    console.log('wrote', f);
  }
}

await browser.close();
