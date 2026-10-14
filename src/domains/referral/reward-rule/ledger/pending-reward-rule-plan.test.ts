import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardRulePlan } from "./pending-reward-rule-plan.js";

test("PendingRewardRulePlan starts in planned", () => {
  const item = newPendingRewardRulePlan("code-151", "label-693");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardRulePlan moves to in progress", () => {
  const item = newPendingRewardRulePlan("code-151", "label-693");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingRewardRulePlan rejects moves from cancelled", () => {
  const item = newPendingRewardRulePlan("code-151", "label-693");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
