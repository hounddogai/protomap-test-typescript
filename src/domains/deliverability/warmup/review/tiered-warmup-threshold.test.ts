import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredWarmupThreshold } from "./tiered-warmup-threshold.js";

test("TieredWarmupThreshold starts in idle", () => {
  const item = newTieredWarmupThreshold("code-173", "name-631");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredWarmupThreshold moves to warming", () => {
  const item = newTieredWarmupThreshold("code-173", "name-631");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredWarmupThreshold rejects moves from stopped", () => {
  const item = newTieredWarmupThreshold("code-173", "name-631");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
