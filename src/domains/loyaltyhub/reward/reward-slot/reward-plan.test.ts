import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardPlan } from "./reward-plan.js";

test("RewardPlan starts in draft", () => {
  const item = newRewardPlan("code-799", "label-217");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardPlan moves to suspended", () => {
  const item = newRewardPlan("code-799", "label-217");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RewardPlan rejects moves from closed", () => {
  const item = newRewardPlan("code-799", "label-217");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
