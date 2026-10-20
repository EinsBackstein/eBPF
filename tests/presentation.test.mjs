import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialLab, readPresentation } from "../src/presentation-model.mjs";
import { actions, publicCommand, summarizeFlows } from "../server/actions.mjs";

test("audience state preserves real evidence while rejecting invalid slide navigation", () => {
  const value = {
    index: 10,
    black: false,
    lab: initialLab(),
    answers: [1, 1, 99],
  };
  assert.deepEqual(readPresentation(value, 16), { ...value, answers: [1] });
  assert.equal(readPresentation({ ...value, index: -1 }, 16), null);
  assert.equal(readPresentation({ ...value, index: 16 }, 16), null);
  assert.equal(readPresentation({ ...value, black: "false" }, 16), null);
  const safe = readPresentation(
    {
      ...value,
      lab: { view: "arbitrary", source: "../../secrets", codeScroll: -3 },
    },
    16,
  );
  assert.equal(safe.lab.view, "split");
  assert.equal(safe.lab.source, "server");
  assert.equal(safe.lab.codeScroll, 0);
});
test("Hubble parser retains policy drop reason and original flow; skips status and malformed lines", () => {
  const flow = {
    time: "2026-10-17T19:00:00Z",
    verdict: "DROPPED",
    drop_reason_desc: "POLICY_DENIED",
    source: { pod_name: "client-b", identity: 123 },
    destination: { pod_name: "web-abc", identity: 456 },
    l4: { TCP: { destination_port: 8080 } },
  };
  const results = summarizeFlows(
    [
      JSON.stringify({ flow }),
      JSON.stringify({ node_status: {} }),
      "bad json",
    ].join("\n"),
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].source, "client-b");
  assert.equal(results[0].dropReason, "POLICY_DENIED");
  assert.deepEqual(results[0].raw, flow);
});
test("available actions are fixed argument arrays confined to the presentation namespace or Cilium read operations", () => {
  for (const [id, a] of Object.entries(actions)) {
    assert.ok(Array.isArray(a.args));
    assert.equal(typeof publicCommand(id), "string");
    if (a.binary === "docker") {
      assert.equal(a.experiment, "xdp");
      assert.deepEqual(a.args.slice(0, 4), [
        "exec",
        "ebpf-talk-xdp",
        "python3",
        "/opt/xdp/control.py",
      ]);
      assert.ok(
        ["status", "block", "clear", "test8080", "test9090"].includes(
          a.args[4],
        ),
      );
    } else if (a.args[0] === "apply")
      assert.match(a.args[2], /^lab\/manifests\/policy-(open|trusted)\.yaml$/);
    else
      assert.ok(a.args.includes("ebpf-talk") || a.args.includes("cilium-dbg"));
    assert.ok(!a.args.includes("sh"));
  }
  assert.equal(publicCommand("delete-everything"), null);
});
test("displayed source is generated from the executable lab files", async () => {
  const generated = JSON.parse(
    await readFile(
      new URL("../src/code.generated.json", import.meta.url),
      "utf8",
    ),
  );
  for (const f of Object.values(generated))
    assert.equal(
      f.raw,
      await readFile(new URL("../" + f.path, import.meta.url), "utf8"),
    );
});

test("audience round trip preserves XDP code selection and measured map deltas", () => {
  const run = {
    id: "measurement",
    experiment: "xdp",
    stdout: "{}",
    flows: { events: [] },
    xdp: {
      blocked_port: 9090,
      before: { PASS: 10, DROP: 0 },
      after: { PASS: 10, DROP: 2 },
      delta: { PASS: 0, DROP: 2 },
      request: { port: 9090, error: "TimeoutError" },
      program: { id: 123 },
    },
  };
  const state = {
    index: 12,
    black: false,
    lab: { ...initialLab(), source: "xdpMaps", codeScroll: 0.65, run },
    answers: [],
  };
  assert.deepEqual(
    readPresentation(JSON.parse(JSON.stringify(state)), 16),
    state,
  );
});

test("old Hubble selection migrates to captured flows; code scrolling is bounded", () => {
  const value = {
    index: 8,
    black: false,
    lab: { ...initialLab(), view: "hubble", codeScroll: 2 },
    answers: [],
  };
  const read = readPresentation(value, 16);
  assert.equal(read.lab.view, "flows");
  assert.equal(read.lab.codeScroll, 1);
});
