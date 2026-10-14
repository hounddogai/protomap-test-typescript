import assert from "node:assert/strict";
import { test } from "node:test";
import { toStepReviewView, toStepReviewViews } from "./step-review-view.js";
import { newStepReview } from "./step-review.js";

test("StepReviewView shows the status in capitals", () => {
  const item = newStepReview("code-930", "label-873");
  const view = toStepReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStepReviewViews([item, item]).length, 2, "views");
});
