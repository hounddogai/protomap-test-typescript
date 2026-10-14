import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleBudget } from "./bid-rule-budget.js";

test("BidRuleBudget starts in draft", () => {
  const item = newBidRuleBudget("code-821", "title-316");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleBudget moves to active", () => {
  const item = newBidRuleBudget("code-821", "title-316");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BidRuleBudget rejects moves from closed", () => {
  const item = newBidRuleBudget("code-821", "title-316");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
