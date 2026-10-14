import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPacingAdjustment } from "./tiered-pacing-adjustment.js";

test("TieredPacingAdjustment starts in new", () => {
  const item = newTieredPacingAdjustment("code-927", "label-231");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPacingAdjustment moves to done", () => {
  const item = newTieredPacingAdjustment("code-927", "label-231");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("TieredPacingAdjustment rejects moves from failed", () => {
  const item = newTieredPacingAdjustment("code-927", "label-231");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
