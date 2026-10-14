import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedStreakCycle } from "./weighted-streak-cycle.js";

test("WeightedStreakCycle starts in created", () => {
  const item = newWeightedStreakCycle("code-193", "label-70");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedStreakCycle moves to validated", () => {
  const item = newWeightedStreakCycle("code-193", "label-70");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("WeightedStreakCycle rejects moves from retired", () => {
  const item = newWeightedStreakCycle("code-193", "label-70");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
