import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardAdjustment } from "./reward-adjustment.js";

test("RewardAdjustment starts in requested", () => {
  const item = newRewardAdjustment("code-628", "name-844");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardAdjustment moves to revoked", () => {
  const item = newRewardAdjustment("code-628", "name-844");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("RewardAdjustment rejects moves from expired", () => {
  const item = newRewardAdjustment("code-628", "name-844");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
