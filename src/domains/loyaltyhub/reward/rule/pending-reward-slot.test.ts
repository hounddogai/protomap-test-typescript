import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardSlot } from "./pending-reward-slot.js";

test("PendingRewardSlot starts in created", () => {
  const item = newPendingRewardSlot("code-692", "label-366");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardSlot moves to validated", () => {
  const item = newPendingRewardSlot("code-692", "label-366");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PendingRewardSlot rejects moves from retired", () => {
  const item = newPendingRewardSlot("code-692", "label-366");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
