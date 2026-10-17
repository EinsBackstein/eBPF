import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4174/api/lab";
const results = [];
async function execute(action) {
  const response = await fetch(base + "/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const record = await response.json();
  assert.equal(record.flows.code, 0, record.flows.stderr);
  results.push({
    action,
    exit: record.code,
    flows: record.flows.events.length,
    id: record.id,
  });
  return record;
}
const rows = (r) =>
  r.stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
try {
  assert.equal(
    (await fetch(base + "/status").then((r) => r.json())).ready,
    true,
  );
  const denied = await fetch(base + "/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://unrelated.example",
    },
    body: JSON.stringify({ action: "policy-trusted" }),
  });
  assert.equal(denied.status, 403);
  const invalid = await fetch(base + "/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete-cluster" }),
  });
  assert.equal(invalid.status, 400);
  await execute("policy-open");
  const baseline = await execute("request-b");
  assert.equal(rows(baseline)[0].status, 200);
  assert.ok(baseline.logs.stdout.includes(rows(baseline)[0].request_id));
  const keepalive = rows(await execute("keepalive"));
  assert.equal(keepalive.length, 5);
  assert.equal(new Set(keepalive.map((r) => r.backend)).size, 1);
  assert.equal(new Set(keepalive.map((r) => r.client_socket)).size, 1);
  const fresh = rows(await execute("new-connections"));
  assert.equal(fresh.length, 10);
  assert.ok(fresh.every((r) => r.status === 200));
  assert.equal(new Set(fresh.map((r) => r.client_socket)).size, 10);
  // Backend randomness has no promised ratio; record the observation, don't require 50:50.
  const observedBackends = [...new Set(fresh.map((r) => r.backend))];
  await execute("policy-trusted");
  const blocked = await execute("request-b");
  assert.equal(blocked.code, 1);
  assert.equal(rows(blocked)[0].error, "TimeoutError");
  assert.ok(
    blocked.flows.events.some(
      (f) =>
        f.source === "client-b" &&
        f.verdict === "DROPPED" &&
        f.dropReason === "POLICY_DENIED",
    ),
  );
  assert.ok(!blocked.logs.stdout.includes(rows(blocked)[0].request_id));
  assert.equal(rows(await execute("request-a"))[0].status, 200);
  const map = await execute("policy-map");
  assert.match(map.stdout, /role=trusted/);
  const lb = await execute("lb-map");
  assert.match(lb.stdout, /:8080\/TCP/);
  await execute("policy-open");
  assert.equal(rows(await execute("request-b"))[0].status, 200);
  const summary = {
    verifiedAt: new Date().toISOString(),
    observedBackends,
    results,
  };
  await writeFile(
    new URL("../evidence/verification.json", import.meta.url),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  // Leave the presentation in its baseline configuration even if an assertion fails.
  await fetch(base + "/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "policy-open" }),
  }).catch(() => {});
}
