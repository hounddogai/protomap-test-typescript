import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedActivationAllocation } from "./weighted-activation-allocation.js";

test("WeightedActivationAllocation starts in created", () => {
  const item = newWeightedActivationAllocation("code-845", "name-164");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedActivationAllocation moves to published", () => {
  const item = newWeightedActivationAllocation("code-845", "name-164");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedActivationAllocation rejects moves from retired", () => {
  const item = newWeightedActivationAllocation("code-845", "name-164");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
