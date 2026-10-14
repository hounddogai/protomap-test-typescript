import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleVariance } from "./bid-rule-variance.js";

test("BidRuleVariance starts in requested", () => {
  const item = newBidRuleVariance("code-761", "title-230");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleVariance moves to expired", () => {
  const item = newBidRuleVariance("code-761", "title-230");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BidRuleVariance rejects moves from expired", () => {
  const item = newBidRuleVariance("code-761", "title-230");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
