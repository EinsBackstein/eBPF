import { readFile, writeFile } from "node:fs/promises";
import { codeToHtml } from "shiki";
const definitions = {
  xdpControl: ["lab/xdp/control.py", "python"],
  xdpMaps: ["lab/xdp/maps.py", "python"],
  xdpRequest: ["lab/xdp/request.py", "python"],
  server: ["lab/app/server.py", "python"],
  client: ["lab/app/client.py", "python"],
  open: ["lab/manifests/policy-open.yaml", "yaml"],
  trusted: ["lab/manifests/policy-trusted.yaml", "yaml"],
  workloads: ["lab/manifests/workloads.yaml", "yaml"],
};
const files = {};
for (const [id, [path, lang]] of Object.entries(definitions)) {
  const raw = await readFile(new URL("../" + path, import.meta.url), "utf8");
  const lines = raw.trimEnd().split("\n");
  const pages = [];
  for (let first = 0; first < lines.length; first += 10) {
    pages.push({
      first: first + 1,
      last: Math.min(first + 10, lines.length),
      html: await codeToHtml(lines.slice(first, first + 10).join("\n"), {
        lang,
        theme: "github-light",
        transformers: [
          {
            line(node, line) {
              node.properties["data-line"] = first + line;
            },
          },
        ],
      }),
    });
  }
  files[id] = { path, raw, lang, pages };
}
await writeFile(
  new URL("../src/code.generated.json", import.meta.url),
  JSON.stringify(files),
);
