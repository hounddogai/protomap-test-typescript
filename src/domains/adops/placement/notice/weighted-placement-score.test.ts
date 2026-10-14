import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPlacementScore } from "./weighted-placement-score.js";

test("WeightedPlacementScore starts in new", () => {
  const item = newWeightedPlacementScore("code-422", "name-556");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPlacementScore moves to failed", () => {
  const item = newWeightedPlacementScore("code-422", "name-556");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("WeightedPlacementScore rejects moves from failed", () => {
  const item = newWeightedPlacementScore("code-422", "name-556");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
