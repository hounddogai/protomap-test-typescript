import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardTier } from "./reward-tier.js";

test("RewardTier starts in requested", () => {
  const item = newRewardTier("code-167", "name-357");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardTier moves to granted", () => {
  const item = newRewardTier("code-167", "name-357");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RewardTier rejects moves from expired", () => {
  const item = newRewardTier("code-167", "name-357");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
