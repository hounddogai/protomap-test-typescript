import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleSlot } from "./bid-rule-slot.js";

test("BidRuleSlot starts in open", () => {
  const item = newBidRuleSlot("code-468", "label-456");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleSlot moves to in review", () => {
  const item = newBidRuleSlot("code-468", "label-456");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BidRuleSlot rejects moves from archived", () => {
  const item = newBidRuleSlot("code-468", "label-456");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
