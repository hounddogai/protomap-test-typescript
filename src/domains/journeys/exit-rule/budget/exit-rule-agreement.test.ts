import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleAgreement } from "./exit-rule-agreement.js";

test("ExitRuleAgreement starts in proposed", () => {
  const item = newExitRuleAgreement("code-34", "title-676");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleAgreement moves to approved", () => {
  const item = newExitRuleAgreement("code-34", "title-676");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleAgreement rejects moves from withdrawn", () => {
  const item = newExitRuleAgreement("code-34", "title-676");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
