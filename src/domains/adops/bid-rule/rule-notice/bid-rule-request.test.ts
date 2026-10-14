import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleRequest } from "./bid-rule-request.js";

test("BidRuleRequest starts in new", () => {
  const item = newBidRuleRequest("code-308", "label-548");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleRequest moves to queued", () => {
  const item = newBidRuleRequest("code-308", "label-548");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BidRuleRequest rejects moves from failed", () => {
  const item = newBidRuleRequest("code-308", "label-548");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
