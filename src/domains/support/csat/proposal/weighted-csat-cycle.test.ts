import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCsatCycle } from "./weighted-csat-cycle.js";

test("WeightedCsatCycle starts in new", () => {
  const item = newWeightedCsatCycle("code-77", "name-975");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCsatCycle moves to running", () => {
  const item = newWeightedCsatCycle("code-77", "name-975");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedCsatCycle rejects moves from failed", () => {
  const item = newWeightedCsatCycle("code-77", "name-975");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
