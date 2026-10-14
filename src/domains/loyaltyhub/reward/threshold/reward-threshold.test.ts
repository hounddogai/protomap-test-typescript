import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardThreshold } from "./reward-threshold.js";

test("RewardThreshold starts in proposed", () => {
  const item = newRewardThreshold("code-222", "label-540");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardThreshold moves to rejected", () => {
  const item = newRewardThreshold("code-222", "label-540");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardThreshold rejects moves from withdrawn", () => {
  const item = newRewardThreshold("code-222", "label-540");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
