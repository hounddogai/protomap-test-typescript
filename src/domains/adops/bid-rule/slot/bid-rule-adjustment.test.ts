import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleAdjustment } from "./bid-rule-adjustment.js";

test("BidRuleAdjustment starts in new", () => {
  const item = newBidRuleAdjustment("code-94", "name-273");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleAdjustment moves to running", () => {
  const item = newBidRuleAdjustment("code-94", "name-273");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BidRuleAdjustment rejects moves from failed", () => {
  const item = newBidRuleAdjustment("code-94", "name-273");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
