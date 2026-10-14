import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveSenderReview } from "./adaptive-sender-review.js";

test("AdaptiveSenderReview starts in planned", () => {
  const item = newAdaptiveSenderReview("code-58", "label-762");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveSenderReview moves to completed", () => {
  const item = newAdaptiveSenderReview("code-58", "label-762");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("AdaptiveSenderReview rejects moves from cancelled", () => {
  const item = newAdaptiveSenderReview("code-58", "label-762");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
