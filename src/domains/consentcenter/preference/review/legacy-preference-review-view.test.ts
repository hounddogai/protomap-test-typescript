import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPreferenceReviewView, toLegacyPreferenceReviewViews } from "./legacy-preference-review-view.js";
import { newLegacyPreferenceReview } from "./legacy-preference-review.js";

test("LegacyPreferenceReviewView shows the status in capitals", () => {
  const item = newLegacyPreferenceReview("code-981", "name-500");
  const view = toLegacyPreferenceReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPreferenceReviewViews([item, item]).length, 2, "views");
});
