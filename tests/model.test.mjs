import { test } from "node:test";
import assert from "node:assert/strict";
import {
  experiments,
  initialExperiment,
  buildTrace,
  requestSamples,
  outcome,
  readPresentation,
  questionFor,
} from "../src/experiment-model.mjs";
test("keep-alive reuses one connection and one backend for five requests", () => {
  const c = experiments[1].cases[0],
    r = requestSamples(c);
  assert.equal(r.length, 5);
  assert.equal(new Set(r.map((v) => v.connection)).size, 1);
  assert.equal(new Set(r.map((v) => v.backend)).size, 1);
  assert.deepEqual(buildTrace(c).at(-1).requests, r);
});
test("new TCP connections each get a backend assignment in the teaching sample", () => {
  const r = requestSamples(experiments[1].cases[1]);
  assert.equal(new Set(r.map((v) => v.connection)).size, 5);
  assert.deepEqual(
    r.map((v) => v.backend),
    ["a", "b", "b", "a", "b"],
  );
  assert.equal(r.filter((v) => v.backend === "a").length, 2);
});
test("policy baseline, restriction, allowed control, and recovery have distinct expected outcomes", () => {
  assert.deepEqual(experiments[2].cases.map(outcome), [
    "PASS",
    "DROP",
    "PASS",
    "PASS",
  ]);
  const blocked = buildTrace(experiments[2].cases[1]).at(-1);
  assert.equal(blocked.appReached, false);
  assert.equal(blocked.requests.length, 0);
  assert.match(blocked.title, /Kein HTTP-Status/);
});
test("XDP port rule blocks 9090, preserves 8080, and permits recovery", () => {
  assert.deepEqual(experiments[3].cases.map(outcome), [
    "PASS",
    "DROP",
    "PASS",
    "PASS",
  ]);
  for (const c of experiments[3].cases) {
    const frames = buildTrace(c);
    assert.ok(frames.slice(0, 4).every((f) => f.verdict === null));
    assert.equal(frames[4].verdict, outcome(c));
    assert.equal(
      frames.at(-1).appReached,
      false,
      "XDP_PASS must not manufacture an HTTP response",
    );
  }
});
test("observation correlates a reply after routing, never before", () => {
  const frames = buildTrace(experiments[0].cases[0]);
  assert.equal(frames[1].appReached, false);
  assert.equal(frames[2].appReached, false);
  assert.equal(frames[3].appReached, true);
  assert.equal(frames[3].requests.length, 1);
});
test("all experiment traces are finite and prediction answers match the modeled decision", () => {
  for (const e of experiments)
    for (const c of e.cases) {
      const f = buildTrace(c);
      assert.equal(f[0].stage, "predict");
      assert.equal(f.at(-1).stage, "result");
      assert.ok(f.length >= 5 && f.length <= 7);
      assert.ok(f.every((v) => v.title && v.explanation));
      if (c.kind === "xdp" || c.kind === "policy")
        assert.equal(questionFor(c).correct, outcome(c) === "PASS" ? 0 : 1);
    }
});
test("presentation state rejects corrupted cases, progress, and predictions", () => {
  const value = {
    index: 11,
    black: false,
    experiment: initialExperiment(),
    answers: [],
  };
  assert.deepEqual(readPresentation(value, 15), value);
  for (const patch of [
    { caseIndex: 99 },
    { step: 99 },
    { prediction: 3 },
    { completed: [99] },
    { step: -1 },
  ])
    assert.equal(
      readPresentation(
        { ...value, experiment: { ...value.experiment, ...patch } },
        15,
      ),
      null,
    );
  assert.equal(readPresentation({ ...value, index: 999 }, 15), null);
  assert.equal(
    readPresentation({ ...value, lab: {}, experiment: null }, 15),
    null,
  );
});
