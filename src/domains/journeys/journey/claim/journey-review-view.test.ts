import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyReviewView, toJourneyReviewViews } from "./journey-review-view.js";
import { newJourneyReview } from "./journey-review.js";

test("JourneyReviewView shows the status in capitals", () => {
  const item = newJourneyReview("code-529", "title-930");
  const view = toJourneyReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyReviewViews([item, item]).length, 2, "views");
});
