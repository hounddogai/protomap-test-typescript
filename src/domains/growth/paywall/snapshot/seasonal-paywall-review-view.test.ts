import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalPaywallReviewView, toSeasonalPaywallReviewViews } from "./seasonal-paywall-review-view.js";
import { newSeasonalPaywallReview } from "./seasonal-paywall-review.js";

test("SeasonalPaywallReviewView shows the status in capitals", () => {
  const item = newSeasonalPaywallReview("code-710", "name-269");
  const view = toSeasonalPaywallReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalPaywallReviewViews([item, item]).length, 2, "views");
});
