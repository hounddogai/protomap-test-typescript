import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

test("BatchedBidRuleSummary starts in open", () => {
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBidRuleSummary moves to resolved", () => {
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BatchedBidRuleSummary rejects moves from archived", () => {
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
