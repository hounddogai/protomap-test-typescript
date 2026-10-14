import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSenderBatch } from "./batched-sender-batch.js";

test("BatchedSenderBatch starts in new", () => {
  const item = newBatchedSenderBatch("code-323", "label-988");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSenderBatch moves to queued", () => {
  const item = newBatchedSenderBatch("code-323", "label-988");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedSenderBatch rejects moves from failed", () => {
  const item = newBatchedSenderBatch("code-323", "label-988");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
