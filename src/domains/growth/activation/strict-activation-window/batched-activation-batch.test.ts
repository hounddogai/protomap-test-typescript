import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedActivationBatch } from "./batched-activation-batch.js";

test("BatchedActivationBatch starts in proposed", () => {
  const item = newBatchedActivationBatch("code-919", "title-196");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedActivationBatch moves to approved", () => {
  const item = newBatchedActivationBatch("code-919", "title-196");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedActivationBatch rejects moves from withdrawn", () => {
  const item = newBatchedActivationBatch("code-919", "title-196");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
