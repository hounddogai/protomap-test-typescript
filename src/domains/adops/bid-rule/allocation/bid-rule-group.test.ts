import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleGroup } from "./bid-rule-group.js";

test("BidRuleGroup starts in requested", () => {
  const item = newBidRuleGroup("code-480", "title-861");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleGroup moves to expired", () => {
  const item = newBidRuleGroup("code-480", "title-861");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BidRuleGroup rejects moves from expired", () => {
  const item = newBidRuleGroup("code-480", "title-861");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
