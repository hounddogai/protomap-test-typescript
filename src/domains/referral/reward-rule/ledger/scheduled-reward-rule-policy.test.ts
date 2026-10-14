import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledRewardRulePolicy } from "./scheduled-reward-rule-policy.js";

test("ScheduledRewardRulePolicy starts in requested", () => {
  const item = newScheduledRewardRulePolicy("code-874", "label-466");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledRewardRulePolicy moves to granted", () => {
  const item = newScheduledRewardRulePolicy("code-874", "label-466");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ScheduledRewardRulePolicy rejects moves from expired", () => {
  const item = newScheduledRewardRulePolicy("code-874", "label-466");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
