#!/usr/bin/env node
// Exports a Draft video to MP4 on this computer, free, with the HyperFrames renderer Draft's own
// exports use, then uploads it to the project's storage and records it as an export.
// Node 22+, Chrome and FFmpeg; HyperFrames runs through npx.
//
//   node render.mjs --document <documentUrl> --export <exportUrl> [--out ./draft-render.mp4]
//                   [--quality looks|draft|delivery] [--no-upload]
//
// Both links come from the export_locally tool and last one hour. Only the signed links, the
// film's own media and the npm registry (for HyperFrames) are fetched.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const HYPERFRAMES = "hyperframes@0.9.98"; // the version this script was verified with

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
if (!args.document) fail("--document <documentUrl> is required (call the export_locally tool to get one).");
const upload = args["no-upload"] !== "true";
if (upload && !args.export) fail("--export <exportUrl> is required to upload the MP4 (or pass --no-upload to keep it here only).");
if (Number(process.versions.node.split(".")[0]) < 22) fail(`Node 22+ is required for HyperFrames (this is ${process.versions.node}).`);
if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0)
  fail("FFmpeg not found. Install it (macOS: brew install ffmpeg; Windows: winget install ffmpeg) and run again.");
const out = path.resolve(args.out || "draft-render.mp4");
const quality = ["draft", "looks", "delivery"].includes(args.quality) ? args.quality : "looks";

async function fetchOk(url, what, init) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(120000), ...init });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    fail(`${what} (${response.status}) ${body.slice(0, 300)}`);
  }
  return response;
}

const doc = await (await fetchOk(args.document, "Could not read the export document")).json();
const work = await mkdtemp(path.join(tmpdir(), "draft-render-"));
const project = path.join(work, "project");
await mkdir(path.join(project, "media"), { recursive: true });

// The film's media becomes local files next to index.html: signed storage links expire and
// headless capture must not depend on them mid-render.
let html = doc.html;
const urls = new Set();
for (const m of html.matchAll(/\b(?:src|poster)\s*=\s*"(https:\/\/[^"]+)"/g)) urls.add(m[1].replaceAll("&amp;", "&"));
for (const m of html.matchAll(/url\(\s*['"]?(https:\/\/[^'")\s]+)['"]?\s*\)/g)) urls.add(m[1].replaceAll("&amp;", "&"));
let mediaBytes = 0;
await Promise.all([...urls].map(async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(300000) }).catch((e) => ({ ok: false, status: e.message }));
  if (!response.ok) fail(`Could not download the film's media (${response.status}): ${url.slice(0, 120)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  mediaBytes += bytes.length;
  const name = `media/${createHash("sha1").update(url).digest("hex").slice(0, 16)}${path.extname(new URL(url).pathname).slice(0, 8)}`;
  await writeFile(path.join(project, name), bytes);
  html = html.replaceAll(url.replaceAll("&", "&amp;"), name).replaceAll(url, name);
}));
await writeFile(path.join(project, "index.html"), html);
console.error(`· ${urls.size} media files (${(mediaBytes / 1e6).toFixed(1)} MB) ready; rendering ${doc.frames} frames at ${doc.fps} fps…`);

const started = Date.now();
const log = path.join(work, "render.log");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npx, ["-y", HYPERFRAMES, "render", "--quality", quality, "--output", out, project], { stdio: ["ignore", "pipe", "pipe"] });
let output = "";
let shown = -1;
const onData = (chunk) => {
  output = (output + chunk).slice(-200000);
  // Progress for the person waiting, at most every 10%.
  const percent = [...String(chunk).matchAll(/(\d{1,3})%/g)].map((m) => Number(m[1])).pop();
  if (percent !== undefined && Math.floor(percent / 10) > shown) {
    shown = Math.floor(percent / 10);
    console.error(`· ${percent}% (${Math.round((Date.now() - started) / 1000)}s)`);
  }
};
child.stdout.on("data", onData);
child.stderr.on("data", onData);
const code = await new Promise((resolve) => child.on("exit", resolve));
await writeFile(log, output);
const renderSeconds = Math.round((Date.now() - started) / 1000);
const size = await stat(out).then((s) => s.size, () => 0);
if (code !== 0 || !size) {
  const reason = output.split("\n").filter((l) => /✗|Failed|Error/i.test(l)).slice(-6).join("\n");
  console.error(reason || output.split("\n").slice(-20).join("\n"));
  await rm(work, { recursive: true, force: true }).catch(() => {});
  fail(`Render failed after ${renderSeconds}s.`);
}

let url = null;
if (upload) {
  const post = async (body) => (await fetchOk(args.export, "Could not record the export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
  const target = await post({ step: "upload", size });
  const put = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "video/mp4", "content-length": String(size) },
    body: createReadStream(out),
    duplex: "half",
    signal: AbortSignal.timeout(30 * 60000),
  });
  if (!put.ok) fail(`Upload failed (${put.status}). The MP4 is still at ${out}.`);
  const done = await post({ step: "complete", key: target.key, size, durationMs: renderSeconds * 1000 });
  url = done.render?.output_url ?? target.url;
}
await rm(work, { recursive: true, force: true }).catch(() => {});
console.log(JSON.stringify({ revisionId: doc.revisionId, composition: doc.composition, width: doc.width, height: doc.height,
  durationSeconds: Math.round((doc.frames / doc.fps) * 100) / 100, path: out, sizeBytes: size, renderSeconds, url }, null, 2));
process.exit();
