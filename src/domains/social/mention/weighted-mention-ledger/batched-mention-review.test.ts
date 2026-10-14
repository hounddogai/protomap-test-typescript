import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedMentionReview } from "./batched-mention-review.js";

test("BatchedMentionReview starts in idle", () => {
  const item = newBatchedMentionReview("code-626", "title-92");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedMentionReview moves to draining", () => {
  const item = newBatchedMentionReview("code-626", "title-92");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedMentionReview rejects moves from stopped", () => {
  const item = newBatchedMentionReview("code-626", "title-92");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
