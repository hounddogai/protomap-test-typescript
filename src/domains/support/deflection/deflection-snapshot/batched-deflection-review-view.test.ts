import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedDeflectionReviewView, toBatchedDeflectionReviewViews } from "./batched-deflection-review-view.js";
import { newBatchedDeflectionReview } from "./batched-deflection-review.js";

test("BatchedDeflectionReviewView shows the status in capitals", () => {
  const item = newBatchedDeflectionReview("code-418", "label-297");
  const view = toBatchedDeflectionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedDeflectionReviewViews([item, item]).length, 2, "views");
});
