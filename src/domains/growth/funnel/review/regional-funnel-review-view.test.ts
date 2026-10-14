import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalFunnelReviewView, toRegionalFunnelReviewViews } from "./regional-funnel-review-view.js";
import { newRegionalFunnelReview } from "./regional-funnel-review.js";

test("RegionalFunnelReviewView shows the status in capitals", () => {
  const item = newRegionalFunnelReview("code-328", "title-897");
  const view = toRegionalFunnelReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalFunnelReviewViews([item, item]).length, 2, "views");
});
