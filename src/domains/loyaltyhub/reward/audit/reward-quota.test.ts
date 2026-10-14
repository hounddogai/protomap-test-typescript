import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardQuota } from "./reward-quota.js";

test("RewardQuota starts in planned", () => {
  const item = newRewardQuota("code-175", "label-588");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardQuota moves to in progress", () => {
  const item = newRewardQuota("code-175", "label-588");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("RewardQuota rejects moves from cancelled", () => {
  const item = newRewardQuota("code-175", "label-588");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
