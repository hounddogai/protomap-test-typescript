import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWarmupCycle } from "./tiered-warmup-cycle.js";

test("TieredWarmupCycle starts in new", () => {
  const item = newTieredWarmupCycle("code-30", "label-588");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWarmupCycle moves to running", () => {
  const item = newTieredWarmupCycle("code-30", "label-588");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredWarmupCycle rejects moves from failed", () => {
  const item = newTieredWarmupCycle("code-30", "label-588");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
