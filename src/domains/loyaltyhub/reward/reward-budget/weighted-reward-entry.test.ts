import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardEntry } from "./weighted-reward-entry.js";

test("WeightedRewardEntry starts in open", () => {
  const item = newWeightedRewardEntry("code-921", "name-719");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardEntry moves to in review", () => {
  const item = newWeightedRewardEntry("code-921", "name-719");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedRewardEntry rejects moves from archived", () => {
  const item = newWeightedRewardEntry("code-921", "name-719");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
