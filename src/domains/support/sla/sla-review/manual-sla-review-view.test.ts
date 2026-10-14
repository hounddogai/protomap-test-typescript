import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualSlaReviewView, toManualSlaReviewViews } from "./manual-sla-review-view.js";
import { newManualSlaReview } from "./manual-sla-review.js";

test("ManualSlaReviewView shows the status in capitals", () => {
  const item = newManualSlaReview("code-10", "title-402");
  const view = toManualSlaReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualSlaReviewViews([item, item]).length, 2, "views");
});
