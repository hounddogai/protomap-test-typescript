import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

test("BatchedBidRuleNotice starts in draft", () => {
  const item = newBatchedBidRuleNotice("code-226", "title-20");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBidRuleNotice moves to active", () => {
  const item = newBatchedBidRuleNotice("code-226", "title-20");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedBidRuleNotice rejects moves from closed", () => {
  const item = newBatchedBidRuleNotice("code-226", "title-20");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
