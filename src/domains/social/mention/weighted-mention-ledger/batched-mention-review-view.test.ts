import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedMentionReviewView, toBatchedMentionReviewViews } from "./batched-mention-review-view.js";
import { newBatchedMentionReview } from "./batched-mention-review.js";

test("BatchedMentionReviewView shows the status in capitals", () => {
  const item = newBatchedMentionReview("code-626", "title-92");
  const view = toBatchedMentionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedMentionReviewViews([item, item]).length, 2, "views");
});
