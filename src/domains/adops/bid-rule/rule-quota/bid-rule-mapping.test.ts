import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleMapping } from "./bid-rule-mapping.js";

test("BidRuleMapping starts in draft", () => {
  const item = newBidRuleMapping("code-93", "title-692");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleMapping moves to pending", () => {
  const item = newBidRuleMapping("code-93", "title-692");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BidRuleMapping rejects moves from closed", () => {
  const item = newBidRuleMapping("code-93", "title-692");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
