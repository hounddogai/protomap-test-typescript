import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionMapping } from "./suppression-mapping.js";

test("SuppressionMapping starts in new", () => {
  const item = newSuppressionMapping("code-280", "label-26");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionMapping moves to done", () => {
  const item = newSuppressionMapping("code-280", "label-26");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("SuppressionMapping rejects moves from failed", () => {
  const item = newSuppressionMapping("code-280", "label-26");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
