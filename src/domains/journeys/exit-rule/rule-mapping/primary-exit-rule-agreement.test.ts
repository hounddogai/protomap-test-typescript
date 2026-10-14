import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryExitRuleAgreement } from "./primary-exit-rule-agreement.js";

test("PrimaryExitRuleAgreement starts in planned", () => {
  const item = newPrimaryExitRuleAgreement("code-137", "label-569");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryExitRuleAgreement moves to scheduled", () => {
  const item = newPrimaryExitRuleAgreement("code-137", "label-569");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PrimaryExitRuleAgreement rejects moves from cancelled", () => {
  const item = newPrimaryExitRuleAgreement("code-137", "label-569");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
