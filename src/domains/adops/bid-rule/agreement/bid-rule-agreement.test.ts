import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleAgreement } from "./bid-rule-agreement.js";

test("BidRuleAgreement starts in draft", () => {
  const item = newBidRuleAgreement("code-689", "label-737");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleAgreement moves to active", () => {
  const item = newBidRuleAgreement("code-689", "label-737");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BidRuleAgreement rejects moves from closed", () => {
  const item = newBidRuleAgreement("code-689", "label-737");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
