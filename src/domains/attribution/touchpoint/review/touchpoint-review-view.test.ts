import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointReviewView, toTouchpointReviewViews } from "./touchpoint-review-view.js";
import { newTouchpointReview } from "./touchpoint-review.js";

test("TouchpointReviewView shows the status in capitals", () => {
  const item = newTouchpointReview("code-669", "title-941");
  const view = toTouchpointReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointReviewViews([item, item]).length, 2, "views");
});
