import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedChallengeAllocation } from "./weighted-challenge-allocation.js";

test("WeightedChallengeAllocation starts in proposed", () => {
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedChallengeAllocation moves to approved", () => {
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedChallengeAllocation rejects moves from withdrawn", () => {
  const item = newWeightedChallengeAllocation("code-698", "title-49");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
