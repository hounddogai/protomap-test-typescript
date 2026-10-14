import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledBidRuleCheckpoint } from "./scheduled-bid-rule-checkpoint.js";

test("ScheduledBidRuleCheckpoint starts in draft", () => {
  const item = newScheduledBidRuleCheckpoint("code-105", "name-689");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledBidRuleCheckpoint moves to pending", () => {
  const item = newScheduledBidRuleCheckpoint("code-105", "name-689");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledBidRuleCheckpoint rejects moves from closed", () => {
  const item = newScheduledBidRuleCheckpoint("code-105", "name-689");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
