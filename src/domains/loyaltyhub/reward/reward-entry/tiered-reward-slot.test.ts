import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredRewardSlot } from "./tiered-reward-slot.js";

test("TieredRewardSlot starts in new", () => {
  const item = newTieredRewardSlot("code-866", "name-401");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredRewardSlot moves to queued", () => {
  const item = newTieredRewardSlot("code-866", "name-401");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("TieredRewardSlot rejects moves from failed", () => {
  const item = newTieredRewardSlot("code-866", "name-401");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
