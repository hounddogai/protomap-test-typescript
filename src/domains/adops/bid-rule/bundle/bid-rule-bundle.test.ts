import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleBundle } from "./bid-rule-bundle.js";

test("BidRuleBundle starts in requested", () => {
  const item = newBidRuleBundle("code-759", "label-178");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleBundle moves to granted", () => {
  const item = newBidRuleBundle("code-759", "label-178");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("BidRuleBundle rejects moves from expired", () => {
  const item = newBidRuleBundle("code-759", "label-178");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
