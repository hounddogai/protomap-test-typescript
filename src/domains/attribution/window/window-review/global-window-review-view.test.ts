import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalWindowReviewView, toGlobalWindowReviewViews } from "./global-window-review-view.js";
import { newGlobalWindowReview } from "./global-window-review.js";

test("GlobalWindowReviewView shows the status in capitals", () => {
  const item = newGlobalWindowReview("code-516", "name-786");
  const view = toGlobalWindowReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalWindowReviewViews([item, item]).length, 2, "views");
});
