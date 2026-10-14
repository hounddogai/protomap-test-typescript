import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackJourneyReviewView, toFallbackJourneyReviewViews } from "./fallback-journey-review-view.js";
import { newFallbackJourneyReview } from "./fallback-journey-review.js";

test("FallbackJourneyReviewView shows the status in capitals", () => {
  const item = newFallbackJourneyReview("code-616", "name-856");
  const view = toFallbackJourneyReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackJourneyReviewViews([item, item]).length, 2, "views");
});
