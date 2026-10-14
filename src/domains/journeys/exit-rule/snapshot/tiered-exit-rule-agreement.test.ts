import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredExitRuleAgreement } from "./tiered-exit-rule-agreement.js";

test("TieredExitRuleAgreement starts in created", () => {
  const item = newTieredExitRuleAgreement("code-309", "name-275");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredExitRuleAgreement moves to validated", () => {
  const item = newTieredExitRuleAgreement("code-309", "name-275");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TieredExitRuleAgreement rejects moves from retired", () => {
  const item = newTieredExitRuleAgreement("code-309", "name-275");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
