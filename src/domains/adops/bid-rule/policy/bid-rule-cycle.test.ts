import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleCycle } from "./bid-rule-cycle.js";

test("BidRuleCycle starts in requested", () => {
  const item = newBidRuleCycle("code-980", "label-495");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleCycle moves to expired", () => {
  const item = newBidRuleCycle("code-980", "label-495");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BidRuleCycle rejects moves from expired", () => {
  const item = newBidRuleCycle("code-980", "label-495");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
