import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedStreakSummary } from "./weighted-streak-summary.js";

test("WeightedStreakSummary starts in requested", () => {
  const item = newWeightedStreakSummary("code-873", "title-900");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedStreakSummary moves to granted", () => {
  const item = newWeightedStreakSummary("code-873", "title-900");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedStreakSummary rejects moves from expired", () => {
  const item = newWeightedStreakSummary("code-873", "title-900");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
