#!/usr/bin/env node
// Draws exact frames of a Draft video on this computer, with the same browser renderer as the
// editor's MP4 export, and writes PNGs plus a contact sheet. Node 20+ and a Chrome; no packages.
//
//   node snapshot.mjs --document <documentUrl from snapshot_frames> --at 1.5,4,8 [--out dir]
//   node snapshot.mjs --document <url> --frames 8          (evenly spaced)
//   node snapshot.mjs --document <url> --range 10:14 --frames 6
//
// Only the signed document link, the public renderer script and the film's own media are fetched.
// Chrome runs headless with a throwaway profile and only opens this script's localhost page.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir, platform, tmpdir } from "node:os";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, i, all) => {
    if (value.startsWith("--")) pairs.push([value.slice(2), all[i + 1]?.startsWith("--") ? "true" : all[i + 1] ?? "true"]);
    return pairs;
  }, []),
);
const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
if (!args.document) fail("--document <documentUrl> is required (call the snapshot_frames tool to get one).");
const out = path.resolve(args.out || "draft-snapshots");
const timeout = Number(args.timeout || 240) * 1000;

function findChrome() {
  if (args.chrome) return args.chrome;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  // Headless shells HyperFrames or Puppeteer already downloaded, then an installed Chrome.
  const cached = [];
  for (const root of [path.join(homedir(), ".cache/hyperframes/chrome/chrome-headless-shell"), path.join(homedir(), ".cache/puppeteer/chrome-headless-shell")]) {
    if (!existsSync(root)) continue;
    for (const version of readdirSync(root).sort().reverse())
      for (const dir of readdirSync(path.join(root, version)).filter((d) => d.startsWith("chrome-headless-shell")))
        cached.push(path.join(root, version, dir, platform() === "win32" ? "chrome-headless-shell.exe" : "chrome-headless-shell"));
  }
  const installed = {
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"],
    linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"],
    win32: [`${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`, `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`],
  }[platform()] || [];
  return [...cached, ...installed].find((p) => existsSync(p))
    || fail("Chrome not found. Install Google Chrome, pass --chrome <path>, or run: npx @puppeteer/browsers install chrome-headless-shell@stable --path ~/.cache/puppeteer");
}

async function fetchOk(url, what) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120000) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    fail(`${what} (${response.status}) ${body.slice(0, 200)}`);
  }
  return response;
}

const doc = await (await fetchOk(args.document, "Could not read the snapshot document")).json();
const rendererUrl = args.renderer || new URL("/video-v2/browser-renderer.js", args.document).toString();
const renderer = await (await fetchOk(rendererUrl, "Could not read the browser renderer")).text();

// Requested times → frames of the film.
const duration = doc.frames / doc.fps;
let times;
if (args.at) times = String(args.at).split(",").map(Number);
else {
  const [from, to] = args.range ? String(args.range).split(":").map(Number) : [0, duration];
  const n = Math.max(1, Math.min(48, Number(args.frames || 6)));
  times = Array.from({ length: n }, (_, i) => from + ((to - from) * (i + 0.5)) / n);
}
if (!times.length || times.some((t) => !Number.isFinite(t) || t < 0)) fail("--at needs comma-separated seconds, e.g. --at 1.5,4,8");
// The renderer returns frames in time order.
times.sort((a, b) => a - b);
const frames = times.map((t) => Math.min(doc.frames - 1, Math.round(t * doc.fps)));

// Media is fetched here, outside the browser, so storage CORS never applies; the page reads it
// from this script's localhost server instead (the editor embeds the same bytes as data URLs).
const work = await mkdtemp(path.join(tmpdir(), "draft-snapshot-"));
const media = new Map();
let html = doc.html;
const urls = new Set();
for (const m of html.matchAll(/\b(?:src|poster)\s*=\s*"(https:\/\/[^"]+)"/g)) urls.add(m[1]);
for (const m of html.matchAll(/url\(\s*['"]?(https:\/\/[^'")\s]+)['"]?\s*\)/g)) urls.add(m[1]);
let port;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    if (req.method === "GET" && url.pathname === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(hostPage());
    }
    if (req.method === "GET" && url.pathname === "/document") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(html);
    }
    if (req.method === "GET" && url.pathname === "/renderer.js") {
      res.setHeader("Content-Type", "text/javascript");
      return res.end(renderer);
    }
    const file = media.get(url.pathname);
    if (req.method === "GET" && file) return serveFile(req, res, file);
    if (req.method === "POST" && url.pathname.startsWith("/result/")) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      results.emit(url.pathname.slice(8), Buffer.concat(chunks));
      return res.end("ok");
    }
    res.statusCode = 404;
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end(String(e));
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
port = server.address().port;

async function serveFile(req, res, file) {
  const bytes = await readFile(file.path);
  res.setHeader("Content-Type", file.type);
  res.setHeader("Accept-Ranges", "bytes");
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (!range) return res.end(bytes);
  const start = range[1] ? Number(range[1]) : bytes.length - Number(range[2]);
  const end = range[1] && range[2] ? Math.min(Number(range[2]), bytes.length - 1) : bytes.length - 1;
  res.statusCode = 206;
  res.setHeader("Content-Range", `bytes ${start}-${end}/${bytes.length}`);
  res.end(bytes.subarray(start, end + 1));
}

let downloaded = 0;
await Promise.all([...urls].map(async (url, i) => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    downloaded += bytes.length;
    const ext = path.extname(new URL(url).pathname).slice(0, 8);
    const name = `/media/${createHash("sha1").update(url).digest("hex").slice(0, 16)}${ext}`;
    await writeFile(path.join(work, `${i}${ext}`), bytes);
    media.set(name, { path: path.join(work, `${i}${ext}`), type: response.headers.get("content-type") || "application/octet-stream" });
    const local = `http://127.0.0.1:${port}${name}`;
    html = html.replaceAll(url.replaceAll("&", "&amp;"), local).replaceAll(url, local);
  } catch (e) {
    console.error(`! media not available, frame may be missing it: ${url.slice(0, 120)} (${e.message})`);
  }
}));

// The page mirrors the editor's export host (lib/video-v2/browser-render.ts): an opaque-origin
// sandboxed iframe running the source and the renderer, driven over a MessageChannel.
function hostPage() {
  const local = `http://127.0.0.1:${port}`;
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><script>
const fps=${doc.fps},frames=${doc.frames},width=${doc.width},height=${doc.height},at=${JSON.stringify(frames)},times=${JSON.stringify(times)};
const post=(name,body)=>fetch('/result/'+name,{method:'POST',body});
const failed=m=>post('error',String(m));
(async()=>{
  const [source,runtime]=await Promise.all([fetch('/document').then(r=>r.text()),fetch('/renderer.js').then(r=>r.text())]);
  const parsed=new DOMParser().parseFromString(source,'text/html');
  parsed.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(e=>e.remove());
  const csp=parsed.createElement('meta');csp.httpEquiv='Content-Security-Policy';
  csp.content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: ${local} data: blob:; media-src https: ${local} data: blob:; font-src https: ${local} data:; connect-src https: ${local} data: blob:; worker-src blob:; frame-src 'none'; base-uri 'none'; form-action 'none'";
  parsed.head.prepend(csp);
  const shim=parsed.createElement('script');
  shim.textContent="addEventListener('error',e=>{const m=e.target;if(m instanceof HTMLMediaElement||m instanceof HTMLImageElement)window.__draftExportError='media failed to load: '+(m.getAttribute('data-hf-id')||m.tagName);else if(e.message)window.__draftExportError=e.message;if(window.__draftExportError)parent.postMessage({type:'draft-v2-export-error',message:window.__draftExportError},'*')},true);addEventListener('unhandledrejection',e=>{window.__draftExportError=String(e.reason?.message||e.reason)});window.__HF_EXPORT_RENDER_SEEK_CONFIG={fps:"+fps+",fpsSource:'render-options',owner:'runtime'};for(const key of ['localStorage','sessionStorage']){const v=new Map();Object.defineProperty(window,key,{value:{getItem:k=>v.get(k)??null,setItem:(k,x)=>v.set(k,String(x)),removeItem:k=>v.delete(k),clear:()=>v.clear(),key:i=>[...v.keys()][i]??null,get length(){return v.size}}})}";
  csp.after(shim);
  for(const m of parsed.querySelectorAll('img,video,audio'))m.setAttribute('crossorigin','anonymous');
  const script=parsed.createElement('script');script.textContent=runtime;parsed.body.append(script);
  const iframe=document.createElement('iframe');
  iframe.sandbox.add('allow-scripts');iframe.width=width;iframe.height=height;
  iframe.style.cssText='position:fixed;left:0;top:0;border:0;width:'+width+'px;height:'+height+'px';
  addEventListener('message',async e=>{
    if(e.source!==iframe.contentWindow)return;
    if(e.data?.type==='draft-v2-export-error')return failed(e.data.message);
    if(e.data?.type!=='draft-v2-export-ready')return;
    const channel=new MessageChannel();
    channel.port1.onmessage=async m=>{
      if(m.data.type==='error')return failed(m.data.message);
      if(m.data.type!=='done')return;
      const images=m.data.images;
      for(let i=0;i<images.length;i++)await post('frame-'+i,images[i]);
      // Contact sheet: up to 4 columns of 640px-wide frames, each labelled with its time.
      const cols=Math.min(4,images.length),w=640,h=Math.round(w*height/width),rows=Math.ceil(images.length/cols);
      const sheet=new OffscreenCanvas(cols*w,rows*(h+28)),c=sheet.getContext('2d');
      c.fillStyle='#1b1b1b';c.fillRect(0,0,sheet.width,sheet.height);c.font='600 16px system-ui';
      for(let i=0;i<images.length;i++){const b=await createImageBitmap(images[i]);const x=(i%cols)*w,y=Math.floor(i/cols)*(h+28);c.fillStyle='#ddd';c.fillText((i+1)+'. '+times[i]+'s',x+8,y+19);c.drawImage(b,x,y+28,w,h);}
      await post('sheet',await sheet.convertToBlob({type:'image/jpeg',quality:0.86}));
      await post('done','');
    };
    iframe.contentWindow.postMessage({type:'draft-v2-stills',width,height,fps,frames,at},'*',[channel.port2]);
  });
  document.body.append(iframe);iframe.getBoundingClientRect();
  iframe.srcdoc=parsed.documentElement.outerHTML;
})().catch(failed);
</script>`;
}

const results = new (await import("node:events")).EventEmitter();
const images = [];
let sheet;
const finished = new Promise((resolve, reject) => {
  results.on("error", (b) => reject(Error(b.toString())));
  results.on("done", resolve);
  results.on("sheet", (b) => { sheet = b; });
  for (let i = 0; i < frames.length; i++) results.on(`frame-${i}`, (b) => { images[i] = b; });
});

const profile = path.join(work, "profile");
const chromePath = findChrome();
const chrome = spawn(chromePath, [
  ...(path.basename(chromePath).startsWith("chrome-headless-shell") ? [] : ["--headless=new"]),
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions",
  "--disable-background-networking", "--disable-sync", "--mute-audio", "--hide-scrollbars",
  "--autoplay-policy=no-user-gesture-required", `--window-size=${doc.width},${doc.height}`,
  `http://127.0.0.1:${port}/`,
], { stdio: ["ignore", "ignore", "pipe"] });
let chromeLog = "";
chrome.stderr.on("data", (d) => { chromeLog = (chromeLog + d).slice(-4000); });
const exited = new Promise((_, reject) => chrome.on("exit", (code) => reject(Error(`Chrome exited (${code}). ${chromeLog.slice(-600)}`))));

try {
  await Promise.race([finished, exited, new Promise((_, r) => setTimeout(() => r(Error(`No frames after ${timeout / 1000}s`)), timeout))]);
  await mkdir(out, { recursive: true });
  const written = [];
  for (let i = 0; i < images.length; i++) {
    const file = path.join(out, `frame-${String(i).padStart(2, "0")}-at-${times[i]}s.png`);
    await writeFile(file, images[i]);
    written.push({ time: times[i], frame: frames[i], path: file });
  }
  const sheetPath = path.join(out, "contact-sheet.jpg");
  if (sheet) await writeFile(sheetPath, sheet);
  console.log(JSON.stringify({ revisionId: doc.revisionId, composition: doc.composition, width: doc.width, height: doc.height,
    frames: written, contactSheet: sheet ? sheetPath : null, mediaBytes: downloaded }, null, 2));
} catch (e) {
  console.error(`✗ Snapshot failed: ${e.message}`);
  process.exitCode = 1;
} finally {
  chrome.kill();
  server.close();
  await rm(work, { recursive: true, force: true }).catch(() => {});
}
process.exit();
