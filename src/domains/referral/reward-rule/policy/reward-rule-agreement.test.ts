import assert from "node:assert/strict";
import { test } from "node:test";
import { newRewardRuleAgreement } from "./reward-rule-agreement.js";

test("RewardRuleAgreement starts in draft", () => {
  const item = newRewardRuleAgreement("code-181", "name-155");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RewardRuleAgreement moves to suspended", () => {
  const item = newRewardRuleAgreement("code-181", "name-155");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("RewardRuleAgreement rejects moves from closed", () => {
  const item = newRewardRuleAgreement("code-181", "name-155");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
