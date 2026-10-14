import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleEstimate } from "./bid-rule-estimate.js";

test("BidRuleEstimate starts in requested", () => {
  const item = newBidRuleEstimate("code-568", "name-461");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleEstimate moves to expired", () => {
  const item = newBidRuleEstimate("code-568", "name-461");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BidRuleEstimate rejects moves from expired", () => {
  const item = newBidRuleEstimate("code-568", "name-461");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
