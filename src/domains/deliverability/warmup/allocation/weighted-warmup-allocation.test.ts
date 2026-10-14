import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

test("WeightedWarmupAllocation starts in requested", () => {
  const item = newWeightedWarmupAllocation("code-44", "label-920");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWarmupAllocation moves to granted", () => {
  const item = newWeightedWarmupAllocation("code-44", "label-920");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedWarmupAllocation rejects moves from expired", () => {
  const item = newWeightedWarmupAllocation("code-44", "label-920");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
