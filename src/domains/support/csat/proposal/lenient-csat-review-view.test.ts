import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCsatReviewView, toLenientCsatReviewViews } from "./lenient-csat-review-view.js";
import { newLenientCsatReview } from "./lenient-csat-review.js";

test("LenientCsatReviewView shows the status in capitals", () => {
  const item = newLenientCsatReview("code-332", "label-891");
  const view = toLenientCsatReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCsatReviewViews([item, item]).length, 2, "views");
});
