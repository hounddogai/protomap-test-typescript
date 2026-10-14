import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("WeightedReputationAdjustment starts in idle", () => {
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReputationAdjustment moves to draining", () => {
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("WeightedReputationAdjustment rejects moves from stopped", () => {
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
