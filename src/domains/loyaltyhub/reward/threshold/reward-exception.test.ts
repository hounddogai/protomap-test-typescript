import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardException } from "./reward-exception.js";

test("RewardException starts in proposed", () => {
  const item = newRewardException("code-63", "label-899");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardException moves to rejected", () => {
  const item = newRewardException("code-63", "label-899");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RewardException rejects moves from withdrawn", () => {
  const item = newRewardException("code-63", "label-899");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
