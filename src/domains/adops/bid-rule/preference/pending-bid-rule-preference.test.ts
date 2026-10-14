import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingBidRulePreference } from "./pending-bid-rule-preference.js";

test("PendingBidRulePreference starts in planned", () => {
  const item = newPendingBidRulePreference("code-583", "label-592");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingBidRulePreference moves to scheduled", () => {
  const item = newPendingBidRulePreference("code-583", "label-592");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("PendingBidRulePreference rejects moves from cancelled", () => {
  const item = newPendingBidRulePreference("code-583", "label-592");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
