import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleCheckpoint } from "./bid-rule-checkpoint.js";

test("BidRuleCheckpoint starts in new", () => {
  const item = newBidRuleCheckpoint("code-484", "label-535");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleCheckpoint moves to running", () => {
  const item = newBidRuleCheckpoint("code-484", "label-535");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BidRuleCheckpoint rejects moves from failed", () => {
  const item = newBidRuleCheckpoint("code-484", "label-535");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
