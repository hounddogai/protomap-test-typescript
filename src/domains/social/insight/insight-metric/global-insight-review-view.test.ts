import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalInsightReviewView, toGlobalInsightReviewViews } from "./global-insight-review-view.js";
import { newGlobalInsightReview } from "./global-insight-review.js";

test("GlobalInsightReviewView shows the status in capitals", () => {
  const item = newGlobalInsightReview("code-325", "label-365");
  const view = toGlobalInsightReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalInsightReviewViews([item, item]).length, 2, "views");
});
