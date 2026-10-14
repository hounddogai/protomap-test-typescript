import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardEstimate } from "./reward-estimate.js";

test("RewardEstimate starts in draft", () => {
  const item = newRewardEstimate("code-567", "title-880");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardEstimate moves to pending", () => {
  const item = newRewardEstimate("code-567", "title-880");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RewardEstimate rejects moves from closed", () => {
  const item = newRewardEstimate("code-567", "title-880");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
