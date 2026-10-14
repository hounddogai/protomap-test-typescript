import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatReviewView, toCsatReviewViews } from "./csat-review-view.js";
import { newCsatReview } from "./csat-review.js";

test("CsatReviewView shows the status in capitals", () => {
  const item = newCsatReview("code-583", "label-77");
  const view = toCsatReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatReviewViews([item, item]).length, 2, "views");
});
