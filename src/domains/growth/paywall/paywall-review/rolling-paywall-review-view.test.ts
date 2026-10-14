import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPaywallReviewView, toRollingPaywallReviewViews } from "./rolling-paywall-review-view.js";
import { newRollingPaywallReview } from "./rolling-paywall-review.js";

test("RollingPaywallReviewView shows the status in capitals", () => {
  const item = newRollingPaywallReview("code-688", "title-150");
  const view = toRollingPaywallReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPaywallReviewViews([item, item]).length, 2, "views");
});
