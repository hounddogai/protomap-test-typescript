import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFunnelReviewView, toStrictFunnelReviewViews } from "./strict-funnel-review-view.js";
import { newStrictFunnelReview } from "./strict-funnel-review.js";

test("StrictFunnelReviewView shows the status in capitals", () => {
  const item = newStrictFunnelReview("code-502", "title-961");
  const view = toStrictFunnelReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFunnelReviewViews([item, item]).length, 2, "views");
});
