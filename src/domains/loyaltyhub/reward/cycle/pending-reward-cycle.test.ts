import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardCycle } from "./pending-reward-cycle.js";

test("PendingRewardCycle starts in planned", () => {
  const item = newPendingRewardCycle("code-493", "label-116");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardCycle moves to in progress", () => {
  const item = newPendingRewardCycle("code-493", "label-116");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingRewardCycle rejects moves from cancelled", () => {
  const item = newPendingRewardCycle("code-493", "label-116");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
