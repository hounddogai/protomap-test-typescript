import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRetentionCheckpoint } from "./batched-retention-checkpoint.js";

test("BatchedRetentionCheckpoint starts in draft", () => {
  const item = newBatchedRetentionCheckpoint("code-233", "label-198");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRetentionCheckpoint moves to suspended", () => {
  const item = newBatchedRetentionCheckpoint("code-233", "label-198");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("BatchedRetentionCheckpoint rejects moves from closed", () => {
  const item = newBatchedRetentionCheckpoint("code-233", "label-198");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
