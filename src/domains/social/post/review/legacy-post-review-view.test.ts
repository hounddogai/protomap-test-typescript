import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPostReviewView, toLegacyPostReviewViews } from "./legacy-post-review-view.js";
import { newLegacyPostReview } from "./legacy-post-review.js";

test("LegacyPostReviewView shows the status in capitals", () => {
  const item = newLegacyPostReview("code-24", "title-950");
  const view = toLegacyPostReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPostReviewViews([item, item]).length, 2, "views");
});
