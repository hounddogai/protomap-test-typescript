import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("BatchedSubscriptionSummary starts in draft", () => {
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSubscriptionSummary moves to closed", () => {
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("BatchedSubscriptionSummary rejects moves from closed", () => {
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
