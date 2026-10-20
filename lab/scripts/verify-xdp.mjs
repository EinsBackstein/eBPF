import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const results = [];
async function execute(action) {
  const response = await fetch("http://127.0.0.1:4174/api/lab/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  const record = await response.json();
  assert.ok(record.xdp, record.stderr || record.stdout);
  assert.equal(
    record.flows.events.length,
    0,
    "XDP must not claim Hubble events",
  );
  assert.equal(
    record.xdp.attachment.xdp.mode,
    2,
    "Must attach in Generic/SKB mode",
  );
  assert.equal(
    record.xdp.attachment.xdp.prog.id,
    record.xdp.program.id,
    "Displayed program must actually be attached",
  );
  results.push({ action, exit: record.code, ...record.xdp });
  return record;
}
try {
  const start = await execute("xdp-clear");
  for (const port of [8080, 9090]) {
    const r = await execute(`xdp-${port}`);
    assert.equal(r.code, 0);
    assert.equal(r.xdp.request.status, 200);
    assert.equal(r.xdp.request.port, port);
    assert.ok(r.xdp.delta.PASS > 0);
  }
  const rule = await execute("xdp-block");
  assert.equal(rule.xdp.blocked_port, 9090);
  const blocked = await execute("xdp-9090");
  assert.equal(blocked.code, 1);
  assert.equal(blocked.xdp.request.error, "TimeoutError");
  assert.ok(blocked.xdp.delta.DROP > 0);
  assert.equal(blocked.xdp.delta.PASS, 0);
  const control = await execute("xdp-8080");
  assert.equal(control.code, 0);
  assert.equal(control.xdp.request.status, 200);
  assert.ok(control.xdp.delta.PASS > 0);
  assert.equal(control.xdp.delta.DROP, 0);
  const reset = await execute("xdp-reset-counters");
  assert.equal(reset.code, 0);
  assert.deepEqual(reset.xdp.after, { PASS: 0, DROP: 0 });
  assert.ok(reset.xdp.before.PASS > 0);
  assert.ok(reset.xdp.before.DROP > 0);
  assert.equal(reset.xdp.blocked_port, 9090, "Reset must preserve the filter rule");
  assert.equal(reset.xdp.program.id, start.xdp.program.id);
  const afterReset = await execute("xdp-9090");
  assert.equal(afterReset.xdp.request.error, "TimeoutError");
  assert.ok(afterReset.xdp.after.DROP > 0, "Counting must resume after reset");
  await execute("xdp-clear");
  const restored = await execute("xdp-9090");
  assert.equal(restored.code, 0);
  assert.equal(restored.xdp.request.status, 200);
  assert.equal(restored.xdp.blocked_port, 0);
  for (const result of results) {
    assert.deepEqual(
      result.program.map_ids,
      start.xdp.program.map_ids,
      "Map objects must remain unchanged",
    );
    assert.equal(
      result.program.id,
      start.xdp.program.id,
      "Map edits must not reload the program",
    );
  }
  await mkdir("lab/evidence", { recursive: true });
  await writeFile(
    "lab/evidence/xdp-verification.json",
    JSON.stringify({ at: new Date().toISOString(), results }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        verified: true,
        steps: results.length,
        program: start.xdp.program.id,
        blocked: blocked.xdp.delta,
        control: control.xdp.delta,
      },
      null,
      2,
    ),
  );
} finally {
  await execute("xdp-clear");
}
