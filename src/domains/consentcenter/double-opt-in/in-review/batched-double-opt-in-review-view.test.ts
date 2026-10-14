import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedDoubleOptInReviewView,
  toBatchedDoubleOptInReviewViews,
} from "./batched-double-opt-in-review-view.js";
import { newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("BatchedDoubleOptInReviewView shows the status in capitals", () => {
  const item = newBatchedDoubleOptInReview("code-767", "name-221");
  const view = toBatchedDoubleOptInReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedDoubleOptInReviewViews([item, item]).length, 2, "views");
});
