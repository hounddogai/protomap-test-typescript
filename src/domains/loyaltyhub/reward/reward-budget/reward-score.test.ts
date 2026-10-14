import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardScore } from "./reward-score.js";

test("RewardScore starts in proposed", () => {
  const item = newRewardScore("code-664", "name-78");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardScore moves to rejected", () => {
  const item = newRewardScore("code-664", "name-78");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardScore rejects moves from withdrawn", () => {
  const item = newRewardScore("code-664", "name-78");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
