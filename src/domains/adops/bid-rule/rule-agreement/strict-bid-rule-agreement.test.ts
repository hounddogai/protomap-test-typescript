import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBidRuleAgreement } from "./strict-bid-rule-agreement.js";

test("StrictBidRuleAgreement starts in new", () => {
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBidRuleAgreement moves to running", () => {
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictBidRuleAgreement rejects moves from failed", () => {
  const item = newStrictBidRuleAgreement("code-960", "label-476");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
