import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofTarget } from "./weighted-proof-target.js";

test("WeightedProofTarget starts in idle", () => {
  const item = newWeightedProofTarget("code-763", "title-728");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofTarget moves to stopped", () => {
  const item = newWeightedProofTarget("code-763", "title-728");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("WeightedProofTarget rejects moves from stopped", () => {
  const item = newWeightedProofTarget("code-763", "title-728");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
