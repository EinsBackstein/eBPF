import { readFile, mkdir, writeFile, realpath, lstat, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export function notesMiddleware(directory, noteIds) {
  const allowed = new Set(noteIds);
  return async (req, res, next) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (!url.pathname.startsWith("/api/presenter-notes/")) return next();
    const send = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
      res.end(JSON.stringify(data));
    };
    const id = url.pathname.slice("/api/presenter-notes/".length);
    if (!allowed.has(id)) return send(404, { error: "Unbekannte Folie." });
    if (req.headers["x-presenter-notes"] !== "1") return send(403, { error: "Nur aus der Referentenansicht verfügbar." });
    const origin = req.headers.origin;
    if (origin) {
      try { if (new URL(origin).host !== req.headers.host) return send(403, { error: "Unerlaubter Ursprung." }); }
      catch { return send(403, { error: "Unerlaubter Ursprung." }); }
    }
    if (!["GET", "PUT"].includes(req.method)) return send(405, { error: "Methode nicht erlaubt." });
    try {
      // Never follow links into another directory or serve arbitrary file paths.
      await mkdir(directory, { recursive: true });
      if ((await lstat(directory)).isSymbolicLink()) return send(403, { error: "Ungültiger Notizordner." });
      const root = await realpath(directory);
      const file = path.join(root, id + ".md");
      try { if ((await lstat(file)).isSymbolicLink()) return send(403, { error: "Ungültige Notizdatei." }); }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      if (req.method === "GET") {
        try { return send(200, { text: await readFile(file, "utf8") }); }
        catch (error) { if (error.code === "ENOENT") return send(200, { text: "" }); throw error; }
      }
      if (!req.headers["content-type"]?.startsWith("text/plain")) return send(415, { error: "Textdatei erwartet." });
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        const buffer = Buffer.from(chunk);
        chunks.push(buffer);
        size += buffer.length;
        if (size > 100000) return send(413, { error: "Sprechtext zu lang." });
      }
      const text = Buffer.concat(chunks).toString("utf8");
      const temp = path.join(root, "." + randomUUID() + ".tmp");
      try { await writeFile(temp, text, { mode: 0o600 }); await rename(temp, file); }
      finally { await unlink(temp).catch(() => {}); }
      return send(200, { text });
    } catch { return send(500, { error: "Sprechtext konnte nicht gelesen oder gespeichert werden." }); }
  };
}
