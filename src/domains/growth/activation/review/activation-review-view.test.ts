import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationReviewView, toActivationReviewViews } from "./activation-review-view.js";
import { newActivationReview } from "./activation-review.js";

test("ActivationReviewView shows the status in capitals", () => {
  const item = newActivationReview("code-561", "title-143");
  const view = toActivationReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationReviewViews([item, item]).length, 2, "views");
});
