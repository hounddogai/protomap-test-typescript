import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedQueueMilestone } from "./batched-queue-milestone.js";

test("BatchedQueueMilestone starts in draft", () => {
  const item = newBatchedQueueMilestone("code-810", "label-102");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedQueueMilestone moves to suspended", () => {
  const item = newBatchedQueueMilestone("code-810", "label-102");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BatchedQueueMilestone rejects moves from closed", () => {
  const item = newBatchedQueueMilestone("code-810", "label-102");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
