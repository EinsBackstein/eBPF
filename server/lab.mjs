import http from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import net from "node:net";
import { actions, publicCommand, summarizeFlows } from "./actions.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const kubeconfig = path.join(root, ".lab/kubeconfig");
const env = { ...process.env, KUBECONFIG: kubeconfig };
const port = 4174;
const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://127.0.0.1:4174",
  "http://localhost:4174",
]);
const hubble = path.join(root, ".lab/bin/hubble");
let busy = false;
const children = [];
const forwards = new Set();

export function run(binary, args, timeout = 20000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn(binary, args, { cwd: root, env, shell: false });
    let stdout = "",
      stderr = "",
      timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeout);
    child.stdout.on("data", (b) => {
      stdout = (stdout + b).slice(-500000);
    });
    child.stderr.on("data", (b) => {
      stderr = (stderr + b).slice(-10000);
    });
    child.on("error", (e) => {
      stderr += e.message;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        code,
        timedOut,
        durationMs: Date.now() - start,
      });
    });
  });
}
function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(data));
}
async function checkContext() {
  const result = await run("kubectl", ["config", "current-context"], 4000);
  if (result.code !== 0 || result.stdout.trim() !== "k3d-ebpf-talk")
    throw new Error(
      "Dedicated lab kubeconfig missing. Run npm run lab:setup first.",
    );
}
async function captureFlows(since) {
  const args = [
    "observe",
    "--server",
    "127.0.0.1:4245",
    "--pod",
    "ebpf-talk/client",
    "--since",
    since,
    "--last",
    "80",
    "-o",
    "json",
  ];
  const result = await run(hubble, args, 8000);
  const events = summarizeFlows(result.stdout);
  // Put drops and HTTP records first; retain every original event and timestamp.
  const priority = (f) => (f.verdict === "DROPPED" ? 0 : f.raw.l7 ? 1 : 2);
  events.sort(
    (a, b) => priority(a) - priority(b) || b.time.localeCompare(a.time),
  );
  return {
    command: "hubble " + args.slice(0, 1).concat(args.slice(3)).join(" "),
    ...result,
    events,
  };
}
const server = http.createServer(async (req, res) => {
  // No CORS. Check Origin and Host as well as requiring JSON to prevent cross-site commands.
  if (!["127.0.0.1:4174", "localhost:4174"].includes(req.headers.host))
    return send(res, 403, { error: "Invalid Host" });
  if (req.headers.origin && !allowedOrigins.has(req.headers.origin))
    return send(res, 403, { error: "Invalid Origin" });
  const url = new URL(req.url, "http://127.0.0.1:4174");
  try {
    if (url.pathname === "/api/lab/status" && req.method === "GET") {
      await checkContext();
      const result = await run(
        "kubectl",
        ["get", "pods", "-n", "ebpf-talk", "-o", "json"],
        5000,
      );
      const pods = result.code === 0 ? JSON.parse(result.stdout).items : [];
      const xdp = await run(
        "docker",
        ["exec", "ebpf-talk-xdp", "test", "-f", "/run/xdp-ready"],
        4000,
      );
      return send(res, 200, {
        xdpReady: xdp.code === 0,
        ready:
          pods.length >= 4 &&
          forwards.size === 2 &&
          pods.every((p) =>
            p.status.conditions?.some(
              (c) => c.type === "Ready" && c.status === "True",
            ),
          ),
        context: "k3d-ebpf-talk",
        pods: pods.map((p) => ({
          name: p.metadata.name,
          phase: p.status.phase,
        })),
        hubbleUrl: "http://127.0.0.1:12000/?namespace=ebpf-talk",
      });
    }
    if (url.pathname === "/api/lab/run" && req.method === "POST") {
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return send(res, 415, { error: "JSON required" });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024)
          return send(res, 413, { error: "Request too large" });
      }
      const { action } = JSON.parse(body);
      if (!Object.hasOwn(actions, action))
        return send(res, 400, { error: "Unknown action" });
      if (busy)
        return send(res, 409, { error: "A lab command is already running" });
      busy = true;
      try {
        if (actions[action].experiment !== "xdp") await checkContext();
        const startedAt = new Date().toISOString();
        const result = await run(
          actions[action].binary || "kubectl",
          actions[action].args,
        );
        if (actions[action].experiment === "xdp") {
          let xdp = null;
          try {
            xdp = JSON.parse(result.stdout);
          } catch {
            /* Preserve failure output. */
          }
          const record = {
            id: crypto.randomUUID(),
            action,
            experiment: "xdp",
            command: publicCommand(action),
            startedAt,
            at: new Date().toISOString(),
            ...result,
            xdp,
            resources: null,
            logs: { stdout: "", stderr: "" },
            flows: { events: [], code: null, command: "", stderr: "" },
          };
          await mkdir(path.join(root, "lab/evidence"), { recursive: true });
          await writeFile(
            path.join(root, "lab/evidence", record.id + ".json"),
            JSON.stringify(record, null, 2),
          );
          return send(res, 200, record);
        }
        // Read current pod labels / policy and backend logs alongside the command result.
        const resources = await run(
          "kubectl",
          [
            "get",
            "pods,service,ciliumnetworkpolicy",
            "-n",
            "ebpf-talk",
            "-o",
            "json",
          ],
          5000,
        );
        const logs = await run("kubectl", actions["backend-logs"].args, 5000);
        const flows = await captureFlows(startedAt);
        const record = {
          id: crypto.randomUUID(),
          action,
          command: publicCommand(action),
          startedAt,
          at: new Date().toISOString(),
          ...result,
          resources: resources.code === 0 ? JSON.parse(resources.stdout) : null,
          logs,
          flows,
        };
        await mkdir(path.join(root, "lab/evidence"), { recursive: true });
        await writeFile(
          path.join(root, "lab/evidence", record.id + ".json"),
          JSON.stringify(record, null, 2),
        );
        return send(res, 200, record);
      } finally {
        busy = false;
      }
    }
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 503, { error: error.message });
  }
});

await checkContext();
// Fail before starting any forward if an existing process owns one of these ports.
for (const candidate of [port, 12000, 4245]) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(candidate, "127.0.0.1", () => probe.close(resolve));
  });
}
for (const [service, mapping] of [
  ["hubble-ui", "12000:80"],
  ["hubble-relay", "4245:80"],
]) {
  const child = spawn(
    "kubectl",
    [
      "port-forward",
      "-n",
      "kube-system",
      "service/" + service,
      "--address",
      "127.0.0.1",
      mapping,
    ],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stdout.on("data", (b) => {
    if (b.toString().includes("Forwarding from")) forwards.add(service);
    process.stdout.write(`[${service}] ${b}`);
  });
  child.stderr.on("data", (b) => process.stderr.write(`[${service}] ${b}`));
  child.on("error", (e) => console.error(service, e.message));
  child.on("close", () => forwards.delete(service));
  children.push(child);
}
server.listen(port, "127.0.0.1", () =>
  console.log(`Lab bridge: http://127.0.0.1:${port} · k3d-ebpf-talk only`),
);
function stop() {
  for (const child of children) child.kill();
  server.close(() => process.exit());
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("exit", () => {
  for (const child of children) child.kill();
});
