import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleAllocation } from "./bid-rule-allocation.js";

test("BidRuleAllocation starts in open", () => {
  const item = newBidRuleAllocation("code-149", "title-60");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleAllocation moves to in review", () => {
  const item = newBidRuleAllocation("code-149", "title-60");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BidRuleAllocation rejects moves from archived", () => {
  const item = newBidRuleAllocation("code-149", "title-60");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
