import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardProfile } from "./weighted-reward-profile.js";

test("WeightedRewardProfile starts in planned", () => {
  const item = newWeightedRewardProfile("code-78", "label-19");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardProfile moves to scheduled", () => {
  const item = newWeightedRewardProfile("code-78", "label-19");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedRewardProfile rejects moves from cancelled", () => {
  const item = newWeightedRewardProfile("code-78", "label-19");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
