import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalPathAdjustment } from "./global-path-adjustment.js";

test("GlobalPathAdjustment starts in new", () => {
  const item = newGlobalPathAdjustment("code-259", "label-856");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalPathAdjustment moves to running", () => {
  const item = newGlobalPathAdjustment("code-259", "label-856");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("GlobalPathAdjustment rejects moves from failed", () => {
  const item = newGlobalPathAdjustment("code-259", "label-856");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
