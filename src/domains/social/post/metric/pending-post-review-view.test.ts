import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPostReviewView, toPendingPostReviewViews } from "./pending-post-review-view.js";
import { newPendingPostReview } from "./pending-post-review.js";

test("PendingPostReviewView shows the status in capitals", () => {
  const item = newPendingPostReview("code-188", "title-534");
  const view = toPendingPostReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPostReviewViews([item, item]).length, 2, "views");
});
