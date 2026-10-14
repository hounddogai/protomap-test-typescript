import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleTier } from "./bid-rule-tier.js";

test("BidRuleTier starts in draft", () => {
  const item = newBidRuleTier("code-33", "name-54");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleTier moves to pending", () => {
  const item = newBidRuleTier("code-33", "name-54");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BidRuleTier rejects moves from closed", () => {
  const item = newBidRuleTier("code-33", "name-54");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
