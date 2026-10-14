import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedOptOutPlan } from "./weighted-opt-out-plan.js";

test("WeightedOptOutPlan starts in requested", () => {
  const item = newWeightedOptOutPlan("code-956", "label-411");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedOptOutPlan moves to granted", () => {
  const item = newWeightedOptOutPlan("code-956", "label-411");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedOptOutPlan rejects moves from expired", () => {
  const item = newWeightedOptOutPlan("code-956", "label-411");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
