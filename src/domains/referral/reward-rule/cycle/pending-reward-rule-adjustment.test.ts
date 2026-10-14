import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

test("PendingRewardRuleAdjustment starts in open", () => {
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRewardRuleAdjustment moves to reopened", () => {
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  try {
    item.moveTo("reopened");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "reopened", "status");
});

test("PendingRewardRuleAdjustment rejects moves from archived", () => {
  const item = newPendingRewardRuleAdjustment("code-970", "label-381");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
