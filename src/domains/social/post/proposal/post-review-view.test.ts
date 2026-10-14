import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostReviewView, toPostReviewViews } from "./post-review-view.js";
import { newPostReview } from "./post-review.js";

test("PostReviewView shows the status in capitals", () => {
  const item = newPostReview("code-398", "label-307");
  const view = toPostReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostReviewViews([item, item]).length, 2, "views");
});
