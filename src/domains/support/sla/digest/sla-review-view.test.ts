import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaReviewView, toSlaReviewViews } from "./sla-review-view.js";
import { newSlaReview } from "./sla-review.js";

test("SlaReviewView shows the status in capitals", () => {
  const item = newSlaReview("code-159", "label-951");
  const view = toSlaReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaReviewViews([item, item]).length, 2, "views");
});
