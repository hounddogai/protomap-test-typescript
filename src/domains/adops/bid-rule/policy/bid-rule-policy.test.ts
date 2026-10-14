import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRulePolicy } from "./bid-rule-policy.js";

test("BidRulePolicy starts in planned", () => {
  const item = newBidRulePolicy("code-526", "title-620");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRulePolicy moves to in progress", () => {
  const item = newBidRulePolicy("code-526", "title-620");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BidRulePolicy rejects moves from cancelled", () => {
  const item = newBidRulePolicy("code-526", "title-620");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
