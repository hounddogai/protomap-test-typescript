import assert from "node:assert/strict";
import { test } from "node:test";
import { toCohortReviewView, toCohortReviewViews } from "./cohort-review-view.js";
import { newCohortReview } from "./cohort-review.js";

test("CohortReviewView shows the status in capitals", () => {
  const item = newCohortReview("code-44", "name-968");
  const view = toCohortReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCohortReviewViews([item, item]).length, 2, "views");
});
