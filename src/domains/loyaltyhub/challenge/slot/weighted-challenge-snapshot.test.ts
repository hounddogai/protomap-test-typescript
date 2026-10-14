import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

test("WeightedChallengeSnapshot starts in planned", () => {
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedChallengeSnapshot moves to completed", () => {
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("WeightedChallengeSnapshot rejects moves from cancelled", () => {
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
