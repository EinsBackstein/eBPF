import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialLab, readPresentation, readLabInteraction, readOutputScroll } from "../src/presentation-model.mjs";
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
        ["status", "block", "clear", "test8080", "test9090", "reset-counters"].includes(
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
    index: 9,
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

test("every displayed code line has its own stable number, including empty lines", async () => {
  const generated = JSON.parse(await readFile(new URL("../src/code.generated.json", import.meta.url), "utf8"));
  for (const file of Object.values(generated)) {
    const numbers = [...file.html.matchAll(/data-line="(\d+)"/g)].map((match) => Number(match[1]));
    assert.deepEqual(numbers, Array.from({ length: file.lineCount }, (_, index) => index + 1));
  }
});


test("both scroll axes survive synchronization and old states default horizontal position to zero", () => {
  const state = { index: 9, black: false, lab: { ...initialLab(), codeScroll: 0.6, codeScrollX: 0.8 }, answers: [] };
  assert.deepEqual(readPresentation(state, 16), state);
  assert.equal(readPresentation({ ...state, lab: { codeScrollX: Infinity } }, 16).lab.codeScrollX, 0);
  assert.equal(readPresentation({ ...state, lab: { codeScrollX: 3 } }, 16).lab.codeScrollX, 1);
  assert.equal(readPresentation({ ...state, lab: { codeScrollX: -2 } }, 16).lab.codeScrollX, 0);
});

test("audience interaction is limited to the matching slide, code source and supported views", () => {
  const message = { index: 9, source: "xdpControl", patch: { view: "source", codeScroll: 0.4, codeScrollX: 0.8, run: { id: "injected" }, black: true } };
  assert.deepEqual(readLabInteraction(message, 9, "xdpControl"), { view: "source", codeScroll: 0.4, codeScrollX: 0.8 });
  assert.equal(readLabInteraction(message, 10, "xdpControl"), null);
  assert.equal(readLabInteraction(message, 9, "xdpMaps"), null);
  assert.equal(readLabInteraction({ ...message, patch: { view: "flows" } }, 9, "xdpControl"), null);
  assert.deepEqual(readLabInteraction({ index: 11, source: "client", patch: { view: "flows", codeScrollX: 3 } }, 11, "client"), { view: "flows", codeScrollX: 1 });
  assert.equal(readLabInteraction({ ...message, patch: { codeScrollX: NaN } }, 9, "xdpControl"), null);
});




test("output scroll positions are bounded and survive the audience round trip", () => {
  const positions = { result: { x: 0.2, y: 0.6 }, logs: { x: 1, y: 0.8 }, terminal: { x: 0, y: 0.9 }, flowList: { x: 0, y: 0.5 }, flowDetails: { x: 0, y: 0.3 }, flowJson: { x: 0.4, y: 1 } };
  const state = { index: 11, black: false, lab: { ...initialLab(), outputScroll: positions }, answers: [] };
  assert.deepEqual(readPresentation(JSON.parse(JSON.stringify(state)), 16), state);
  assert.deepEqual(readOutputScroll({ logs: { x: -1, y: 5 }, secret: { x: 1, y: 1 }, result: { x: NaN, y: 1 } }), { logs: { x: 0, y: 1 } });
  assert.deepEqual(readPresentation({ ...state, lab: {} }, 16).lab.outputScroll, {});
});

test("audience output scroll only applies to the current measurement", () => {
  const request = { index: 11, source: "client", runId: "current", patch: { outputScroll: { logs: { x: 0.2, y: 0.7 } } } };
  assert.deepEqual(readLabInteraction(request, 11, "client", "current"), request.patch);
  assert.equal(readLabInteraction(request, 11, "client", "new-measurement"), null);
  assert.equal(readLabInteraction({ ...request, patch: { outputScroll: { unexpected: { x: 1, y: 1 } } } }, 11, "client", "current"), null);
});
