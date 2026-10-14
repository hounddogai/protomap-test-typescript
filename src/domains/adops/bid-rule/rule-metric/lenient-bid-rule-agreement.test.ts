import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientBidRuleAgreement } from "./lenient-bid-rule-agreement.js";

test("LenientBidRuleAgreement starts in new", () => {
  const item = newLenientBidRuleAgreement("code-128", "name-288");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientBidRuleAgreement moves to running", () => {
  const item = newLenientBidRuleAgreement("code-128", "name-288");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LenientBidRuleAgreement rejects moves from failed", () => {
  const item = newLenientBidRuleAgreement("code-128", "name-288");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
