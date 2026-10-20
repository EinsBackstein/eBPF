import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, readdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { notesMiddleware } from "../server/presenter-notes.mjs";

async function request(handler, method, url, chunks = [], extra = {}) {
  const req = Readable.from(chunks);
  req.method = method;
  req.url = url;
  req.headers = { host: "127.0.0.1:5173", "x-presenter-notes": "1", "content-type": "text/plain;charset=utf-8", ...extra };
  let result;
  const res = { writeHead(status, headers) { result = { status, headers }; }, end(body) { result.body = JSON.parse(body); } };
  await handler(req, res, () => { result = { next: true }; });
  return result;
}

test("private notes load from disk, save UTF-8 and refresh without rebuilding", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ebpf-notes-"));
  try {
    const handler = notesMiddleware(directory, ["01-titel"]);
    const url = "/api/presenter-notes/01-titel";
    assert.equal((await request(handler, "GET", url)).body.text, "");
    const text = "Private Erklärung. Grüße!\nZweite Zeile.";
    const bytes = Buffer.from(text);
    const result = await request(handler, "PUT", url, Array.from(bytes, (byte) => Buffer.from([byte])));
    assert.equal(result.status, 200);
    assert.equal(await readFile(path.join(directory, "01-titel.md"), "utf8"), text);
    assert.equal((await request(handler, "GET", url)).headers["Cache-Control"], "no-store");
    await writeFile(path.join(directory, "01-titel.md"), "Extern geändert");
    assert.equal((await request(handler, "GET", url)).body.text, "Extern geändert");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("private note requests reject unknown paths, foreign origins, links and oversized writes", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ebpf-notes-"));
  try {
    const handler = notesMiddleware(directory, ["01-titel"]);
    const url = "/api/presenter-notes/01-titel";
    assert.equal((await request(handler, "GET", "/api/presenter-notes/secret")).status, 404);
    assert.equal((await request(handler, "GET", url, [], { "x-presenter-notes": "" })).status, 403);
    assert.equal((await request(handler, "PUT", url, ["test"], { origin: "https://example.com" })).status, 403);
    assert.equal((await request(handler, "PUT", url, ["test"], { "content-type": "application/json" })).status, 415);
    assert.equal((await request(handler, "PUT", url, ["x".repeat(100001)])).status, 413);
    assert.equal((await request(handler, "DELETE", url)).status, 405);
    await writeFile(path.join(directory, "other.md"), "untouched");
    await symlink(path.join(directory, "other.md"), path.join(directory, "01-titel.md"));
    assert.equal((await request(handler, "PUT", url, ["overwrite"])).status, 403);
    assert.equal(await readFile(path.join(directory, "other.md"), "utf8"), "untouched");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("public slide metadata contains note IDs but no speaker text", async () => {
  const deck = await readFile(new URL("../src/deck.ts", import.meta.url), "utf8");
  assert.doesNotMatch(deck, /\bnotes\s*:/);
  const ids = [...deck.matchAll(/notesId: "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 16);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^\d{2}-[a-z-]+$/);
  let assets;
  try { assets = await readdir(new URL("../dist/assets/", import.meta.url)); }
  catch { return; }
  const bundle = (await Promise.all(assets.filter((file) => file.endsWith(".js")).map((file) => readFile(new URL("../dist/assets/" + file, import.meta.url), "utf8")))).join("\n");
  for (const id of ids) {
    let text;
    try { text = await readFile(new URL("../speaker-notes/" + id + ".md", import.meta.url), "utf8"); }
    catch { continue; }
    const paragraph = text.split("\n\n").find((part) => part.length > 100);
    if (paragraph) assert.ok(!bundle.includes(JSON.stringify(paragraph).slice(1, -1)), `Private text found in bundle: ${id}`);
  }
});
