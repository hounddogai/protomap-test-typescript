import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRedemptionReview } from "./batched-redemption-review.js";

test("BatchedRedemptionReview starts in proposed", () => {
  const item = newBatchedRedemptionReview("code-844", "name-495");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRedemptionReview moves to approved", () => {
  const item = newBatchedRedemptionReview("code-844", "name-495");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BatchedRedemptionReview rejects moves from withdrawn", () => {
  const item = newBatchedRedemptionReview("code-844", "name-495");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
