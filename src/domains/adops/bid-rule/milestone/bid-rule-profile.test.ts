import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleProfile } from "./bid-rule-profile.js";

test("BidRuleProfile starts in draft", () => {
  const item = newBidRuleProfile("code-949", "label-795");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleProfile moves to active", () => {
  const item = newBidRuleProfile("code-949", "label-795");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BidRuleProfile rejects moves from closed", () => {
  const item = newBidRuleProfile("code-949", "label-795");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
