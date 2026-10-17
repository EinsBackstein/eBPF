import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialLab,
  packetDecision,
  sendPackets,
  readSnapshot,
} from "../src/model.mjs";
test("XDP drops only selected blocked TCP port and restores access", () => {
  assert.equal(
    packetDecision({ ...initialLab, mode: "xdp", filter: true }).action,
    "DROP",
  );
  assert.equal(
    packetDecision({ ...initialLab, mode: "xdp", filter: true, port: 8080 })
      .action,
    "PASS",
  );
  assert.equal(
    packetDecision({ ...initialLab, mode: "xdp", filter: false }).action,
    "PASS",
  );
});
test("network policy restricts guest independently of XDP", () => {
  assert.equal(
    packetDecision({
      ...initialLab,
      mode: "network",
      policy: true,
      client: "guest",
    }).action,
    "DROP",
  );
  assert.equal(
    packetDecision({ ...initialLab, mode: "network", policy: true }).action,
    "PASS",
  );
  assert.equal(
    packetDecision({
      ...initialLab,
      mode: "xdp",
      policy: true,
      client: "guest",
    }).action,
    "PASS",
  );
});
test("counters and backend samples track events; blocked traffic never reaches backend", () => {
  let lab = sendPackets(initialLab, "network", 20, () => 0.1);
  assert.equal(lab.a, 20);
  assert.equal(lab.pass, 20);
  assert.ok(lab.events.every((event) => event.port === 8080));
  assert.equal(initialLab.sent, 0);
  lab = sendPackets({ ...lab, policy: true, client: "guest" }, "network", 20);
  assert.equal(lab.drop, 20);
  assert.equal(lab.sent, 40);
  assert.equal(lab.a + lab.b, 20);
  assert.equal(lab.events.length, 30);
});
test("invalid saved state is discarded", () => {
  assert.equal(readSnapshot({ index: 999 }, 15), null);
  assert.equal(
    readSnapshot({ index: 0, lab: { ...initialLab, drop: 2 } }, 15),
    null,
  );
  assert.equal(
    readSnapshot({ index: 0, lab: { ...initialLab, port: 22 } }, 15),
    null,
  );
  assert.equal(
    readSnapshot(
      { index: 0, lab: { ...initialLab, events: [{ action: "INJECT" }] } },
      15,
    ),
    null,
  );
  assert.equal(
    readSnapshot({ index: 0, lab: initialLab, answers: [0, 99] }, 15).answers
      .length,
    1,
  );
});
