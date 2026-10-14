import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedCreativeReviewView, toBatchedCreativeReviewViews } from "./batched-creative-review-view.js";
import { newBatchedCreativeReview } from "./batched-creative-review.js";

test("BatchedCreativeReviewView shows the status in capitals", () => {
  const item = newBatchedCreativeReview("code-358", "title-526");
  const view = toBatchedCreativeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedCreativeReviewViews([item, item]).length, 2, "views");
});
