import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

test("ManualBidRuleAgreement starts in planned", () => {
  const item = newManualBidRuleAgreement("code-129", "name-922");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualBidRuleAgreement moves to in progress", () => {
  const item = newManualBidRuleAgreement("code-129", "name-922");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualBidRuleAgreement rejects moves from cancelled", () => {
  const item = newManualBidRuleAgreement("code-129", "name-922");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
