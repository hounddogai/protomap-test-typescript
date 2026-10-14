import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardSlot } from "./reward-slot.js";

test("RewardSlot starts in proposed", () => {
  const item = newRewardSlot("code-803", "name-78");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardSlot moves to approved", () => {
  const item = newRewardSlot("code-803", "name-78");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RewardSlot rejects moves from withdrawn", () => {
  const item = newRewardSlot("code-803", "name-78");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
