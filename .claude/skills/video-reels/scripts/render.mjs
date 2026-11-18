#!/usr/bin/env node
// Deterministic HTML -> video renderer for the video-reels skill.
// The page must expose window.__seek(t) (may return a Promise), window.__duration and optionally window.__ready.
// The page's folder is served over a local HTTP server (ES modules, fetch and fonts work; file:// would block them).
//
//   node render.mjs page.html --out reel.mp4 [--fps 30 --width 1080 --height 1920 --crf 18 --workers 3 --shutter 1]
//   node render.mjs page.html --sheet sheet.png [--count 16]
//   node render.mjs page.html --at 0,2.5,7 --stills dir/
//
// --workers N   render N frame ranges in parallel browsers, then concat (lossless-ish intermediates)
// --shutter S   motion blur: render S sub-frames per frame across a 180-degree shutter and average them
// --range a,b   render only seconds [a,b) (for previews)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, statSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) { try { return require(p); } catch {} }
  throw new Error('playwright not found');
}
const { chromium } = loadPlaywright();

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const pageArg = argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
if (!pageArg) { console.error('usage: render.mjs page.html --out x.mp4 | --sheet x.png | --at t1,t2 --stills dir'); process.exit(1); }

const fps = Number(opt('fps', 30));
const width = Number(opt('width', 1080));
const height = Number(opt('height', 1920));
const crf = String(opt('crf', 18));
const workers = Math.max(1, Number(opt('workers', 1)));
const shutter = Math.max(1, Number(opt('shutter', 1)));
const GL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];

// ---------- static server ----------
const root = path.dirname(path.resolve(pageArg));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.hdr': 'application/octet-stream', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${path.basename(pageArg)}`;

async function launch() {
  let browser;
  try { browser = await chromium.launch({ args: GL_ARGS }); }
  catch (e) { if (!existsSync('/opt/pw-browsers/chromium')) throw e; browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: GL_ARGS }); }
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(async () => { if (window.__ready) await window.__ready; await document.fonts.ready; });
  return { browser, page };
}
async function shot(page, t) { await page.evaluate((tt) => window.__seek(tt), t); return page.screenshot({ type: 'png' }); }

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  p.stdin.on('error', () => {});
  return { stdin: p.stdin, done };
}
const write = (stream, buf) => new Promise((res) => (stream.write(buf) ? res() : stream.once('drain', res)));

const probe = await launch();
const duration = Number(opt('duration', await probe.page.evaluate(() => window.__duration)));
if (!duration) throw new Error('page did not set window.__duration');

if (opt('out')) {
  const out = path.resolve(opt('out'));
  const [ra, rb] = (opt('range') || `0,${duration}`).split(',').map(Number);
  const f0 = Math.round(ra * fps), f1 = Math.round(rb * fps);
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const per = Math.ceil((f1 - f0) / workers);
  const t0 = Date.now();
  let doneFrames = 0;
  const progress = () => process.stdout.write(`\rframes ${doneFrames}/${f1 - f0}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  async function worker(w) {
    const a = f0 + w * per, b = Math.min(f1, a + per);
    if (a >= b) return null;
    const ctx = w === 0 ? probe : await launch();
    const seg = path.join(tmp, `seg${w}.mkv`);
    // sub-frames are averaged by tmix, then every S-th frame kept
    const vf = shutter > 1 ? [`tmix=frames=${shutter}`, `select='not(mod(n+1\\,${shutter}))'`, 'setpts=N/FRAME_RATE/TB'] : [];
    const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(fps * shutter), '-i', '-',
      ...(vf.length ? ['-vf', vf.join(',')] : []), '-r', String(fps),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '10', '-pix_fmt', 'yuv444p', seg]);
    for (let f = a; f < b; f++) {
      for (let s = 0; s < shutter; s++) {
        // 180-degree shutter: sub-samples span half a frame, centred on the frame time
        const t = f / fps + (shutter > 1 ? ((s + 0.5) / shutter - 0.5) * (0.5 / fps) : 0);
        await write(ff.stdin, await shot(ctx.page, Math.max(0, Math.min(duration - 1e-4, t))));
      }
      doneFrames++; if (doneFrames % 10 === 0) progress();
    }
    ff.stdin.end(); await ff.done;
    if (ctx !== probe) await ctx.browser.close();
    return seg;
  }
  const segs = (await Promise.all([...Array(workers).keys()].map(worker))).filter(Boolean);
  progress();
  const list = path.join(tmp, 'list.txt');
  writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const audio = opt('audio');
  const ff = ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, ...(audio ? ['-i', path.resolve(audio)] : []),
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(fps),
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest'] : []), '-movflags', '+faststart', out]);
  ff.stdin.end(); await ff.done;
  rmSync(tmp, { recursive: true, force: true });
  console.log(`\nwrote ${out} (${f1 - f0} frames @ ${fps}fps, shutter ${shutter}, ${workers} workers)`);
}

if (opt('sheet')) {
  const n = Number(opt('count', 16));
  const cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
  const tw = 270, th = Math.round((270 * height) / width);
  const ff = ffmpeg(['-f', 'image2pipe', '-i', '-', '-vf', `scale=${tw}:${th},tile=${cols}x${rows}:padding=6:color=gray`, '-frames:v', '1', path.resolve(opt('sheet'))]);
  for (let i = 0; i < n; i++) await write(ff.stdin, await shot(probe.page, (duration * (i + 0.5)) / n));
  ff.stdin.end(); await ff.done;
  console.log(`wrote ${opt('sheet')} (${n} frames at ((i+0.5)/${n})*${duration}s)`);
}

if (opt('at')) {
  const dir = path.resolve(opt('stills', 'stills'));
  mkdirSync(dir, { recursive: true });
  for (const t of opt('at').split(',').map(Number)) {
    const s0 = Date.now();
    const buf = await shot(probe.page, t);
    const f = path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`);
    writeFileSync(f, buf);
    console.log('wrote', f, `${Date.now() - s0}ms`);
  }
}

await probe.browser.close();
server.close();
