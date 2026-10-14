import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCreativeReviewView, toRegionalCreativeReviewViews } from "./regional-creative-review-view.js";
import { newRegionalCreativeReview } from "./regional-creative-review.js";

test("RegionalCreativeReviewView shows the status in capitals", () => {
  const item = newRegionalCreativeReview("code-225", "title-226");
  const view = toRegionalCreativeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCreativeReviewViews([item, item]).length, 2, "views");
});
