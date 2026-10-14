import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedJourneyTarget } from "./weighted-journey-target.js";

test("WeightedJourneyTarget starts in planned", () => {
  const item = newWeightedJourneyTarget("code-784", "label-401");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedJourneyTarget moves to scheduled", () => {
  const item = newWeightedJourneyTarget("code-784", "label-401");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedJourneyTarget rejects moves from cancelled", () => {
  const item = newWeightedJourneyTarget("code-784", "label-401");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
