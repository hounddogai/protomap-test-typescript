import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutReviewView, toOptOutReviewViews } from "./opt-out-review-view.js";
import { newOptOutReview } from "./opt-out-review.js";

test("OptOutReviewView shows the status in capitals", () => {
  const item = newOptOutReview("code-960", "title-557");
  const view = toOptOutReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutReviewViews([item, item]).length, 2, "views");
});
