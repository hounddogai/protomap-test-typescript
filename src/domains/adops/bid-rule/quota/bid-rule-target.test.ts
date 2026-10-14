import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleTarget } from "./bid-rule-target.js";

test("BidRuleTarget starts in planned", () => {
  const item = newBidRuleTarget("code-924", "title-191");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleTarget moves to cancelled", () => {
  const item = newBidRuleTarget("code-924", "title-191");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("BidRuleTarget rejects moves from cancelled", () => {
  const item = newBidRuleTarget("code-924", "title-191");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
