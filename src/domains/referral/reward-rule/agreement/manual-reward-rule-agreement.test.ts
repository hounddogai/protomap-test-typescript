import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualRewardRuleAgreement } from "./manual-reward-rule-agreement.js";

test("ManualRewardRuleAgreement starts in proposed", () => {
  const item = newManualRewardRuleAgreement("code-996", "title-650");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualRewardRuleAgreement moves to rejected", () => {
  const item = newManualRewardRuleAgreement("code-996", "title-650");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ManualRewardRuleAgreement rejects moves from withdrawn", () => {
  const item = newManualRewardRuleAgreement("code-996", "title-650");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
