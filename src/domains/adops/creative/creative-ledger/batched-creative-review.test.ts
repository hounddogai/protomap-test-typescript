import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedCreativeReview } from "./batched-creative-review.js";

test("BatchedCreativeReview starts in planned", () => {
  const item = newBatchedCreativeReview("code-358", "title-526");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedCreativeReview moves to scheduled", () => {
  const item = newBatchedCreativeReview("code-358", "title-526");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedCreativeReview rejects moves from cancelled", () => {
  const item = newBatchedCreativeReview("code-358", "title-526");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
