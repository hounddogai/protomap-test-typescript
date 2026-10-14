import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleSegment } from "./bid-rule-segment.js";

test("BidRuleSegment starts in requested", () => {
  const item = newBidRuleSegment("code-481", "label-255");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleSegment moves to expired", () => {
  const item = newBidRuleSegment("code-481", "label-255");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BidRuleSegment rejects moves from expired", () => {
  const item = newBidRuleSegment("code-481", "label-255");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
