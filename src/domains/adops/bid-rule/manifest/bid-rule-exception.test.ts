import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleException } from "./bid-rule-exception.js";

test("BidRuleException starts in planned", () => {
  const item = newBidRuleException("code-774", "label-97");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleException moves to in progress", () => {
  const item = newBidRuleException("code-774", "label-97");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("BidRuleException rejects moves from cancelled", () => {
  const item = newBidRuleException("code-774", "label-97");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
