import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelReviewView, toFunnelReviewViews } from "./funnel-review-view.js";
import { newFunnelReview } from "./funnel-review.js";

test("FunnelReviewView shows the status in capitals", () => {
  const item = newFunnelReview("code-62", "name-707");
  const view = toFunnelReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelReviewViews([item, item]).length, 2, "views");
});
