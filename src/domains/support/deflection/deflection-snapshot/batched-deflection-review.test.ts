import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedDeflectionReview } from "./batched-deflection-review.js";

test("BatchedDeflectionReview starts in new", () => {
  const item = newBatchedDeflectionReview("code-418", "label-297");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedDeflectionReview moves to failed", () => {
  const item = newBatchedDeflectionReview("code-418", "label-297");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BatchedDeflectionReview rejects moves from failed", () => {
  const item = newBatchedDeflectionReview("code-418", "label-297");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
