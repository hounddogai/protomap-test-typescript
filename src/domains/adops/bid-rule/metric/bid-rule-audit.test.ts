import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleAudit } from "./bid-rule-audit.js";

test("BidRuleAudit starts in open", () => {
  const item = newBidRuleAudit("code-229", "title-733");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleAudit moves to in review", () => {
  const item = newBidRuleAudit("code-229", "title-733");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BidRuleAudit rejects moves from archived", () => {
  const item = newBidRuleAudit("code-229", "title-733");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
