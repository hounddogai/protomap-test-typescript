import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedApprovalReview } from "./batched-approval-review.js";

test("BatchedApprovalReview starts in draft", () => {
  const item = newBatchedApprovalReview("code-283", "title-439");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedApprovalReview moves to active", () => {
  const item = newBatchedApprovalReview("code-283", "title-439");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("BatchedApprovalReview rejects moves from closed", () => {
  const item = newBatchedApprovalReview("code-283", "title-439");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
