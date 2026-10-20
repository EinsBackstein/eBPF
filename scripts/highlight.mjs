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
  const lineCount = raw.trimEnd().split("\n").length;
  const html = await codeToHtml(raw.trimEnd(), {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    transformers: [
      {
        line(node, line) {
          node.properties["data-line"] = line;
        },
      },
    ],
  });
  files[id] = { path, raw, lang, lineCount, html };
}
await writeFile(
  new URL("../src/code.generated.json", import.meta.url),
  JSON.stringify(files),
);
