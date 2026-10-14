import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedJourneyReviewView, toCappedJourneyReviewViews } from "./capped-journey-review-view.js";
import { newCappedJourneyReview } from "./capped-journey-review.js";

test("CappedJourneyReviewView shows the status in capitals", () => {
  const item = newCappedJourneyReview("code-97", "title-564");
  const view = toCappedJourneyReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedJourneyReviewViews([item, item]).length, 2, "views");
});
