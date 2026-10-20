import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWithJq } from "../server/json-output.mjs";
import { jsonTokens } from "../src/json-output.mjs";

test("jq formats objects and JSON streams without modifying the source", async () => {
  const raw = '{"value":1,"enabled":true}\n{"value":null}';
  const formatted = await formatWithJq(raw);
  assert.equal(formatted, '{\n  "value": 1,\n  "enabled": true\n}\n{\n  "value": null\n}\n');
  assert.equal(await formatWithJq("false"), "false\n");
  assert.equal(await formatWithJq("null"), "null\n");
  assert.equal(await formatWithJq(""), null);
  assert.equal(await formatWithJq("plain text"), null);
  assert.equal(await formatWithJq('{"partial":'), null);
  assert.equal(await formatWithJq('{"valid":1}\nnot-json'), null);
});

test("JSON highlighting preserves all text including escaped strings and HTML", () => {
  const text = '{\n  "key": "<script>\\\"hi\\\"</script>",\n  "n": -1.5e+2,\n  "b": true,\n  "nil": null\n}\n';
  const tokens = jsonTokens(text);
  assert.equal(tokens.map((token) => token.value).join(""), text);
  assert.ok(tokens.some((token) => token.kind === "key"));
  assert.ok(tokens.some((token) => token.kind === "string"));
  assert.ok(tokens.some((token) => token.kind === "number"));
  assert.ok(tokens.some((token) => token.kind === "boolean"));
  assert.ok(tokens.some((token) => token.kind === "null"));
});
