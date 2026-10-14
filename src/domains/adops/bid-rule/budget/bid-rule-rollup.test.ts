import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleRollup } from "./bid-rule-rollup.js";

test("BidRuleRollup starts in draft", () => {
  const item = newBidRuleRollup("code-126", "label-995");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleRollup moves to pending", () => {
  const item = newBidRuleRollup("code-126", "label-995");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BidRuleRollup rejects moves from closed", () => {
  const item = newBidRuleRollup("code-126", "label-995");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
