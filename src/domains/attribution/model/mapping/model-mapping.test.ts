import assert from "node:assert/strict";
import { test } from "node:test";
import { newModelMapping } from "./model-mapping.js";

test("ModelMapping starts in proposed", () => {
  const item = newModelMapping("code-280", "label-720");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ModelMapping moves to withdrawn", () => {
  const item = newModelMapping("code-280", "label-720");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ModelMapping rejects moves from withdrawn", () => {
  const item = newModelMapping("code-280", "label-720");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
