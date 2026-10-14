import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPostReview } from "./pending-post-review.js";

test("PendingPostReview starts in planned", () => {
  const item = newPendingPostReview("code-188", "title-534");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPostReview moves to in progress", () => {
  const item = newPendingPostReview("code-188", "title-534");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingPostReview rejects moves from cancelled", () => {
  const item = newPendingPostReview("code-188", "title-534");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
