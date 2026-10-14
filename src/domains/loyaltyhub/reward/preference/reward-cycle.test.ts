import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardCycle } from "./reward-cycle.js";

test("RewardCycle starts in planned", () => {
  const item = newRewardCycle("code-467", "title-723");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardCycle moves to scheduled", () => {
  const item = newRewardCycle("code-467", "title-723");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("RewardCycle rejects moves from cancelled", () => {
  const item = newRewardCycle("code-467", "title-723");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
