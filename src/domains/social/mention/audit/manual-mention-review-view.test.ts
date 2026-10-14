import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualMentionReviewView, toManualMentionReviewViews } from "./manual-mention-review-view.js";
import { newManualMentionReview } from "./manual-mention-review.js";

test("ManualMentionReviewView shows the status in capitals", () => {
  const item = newManualMentionReview("code-823", "label-185");
  const view = toManualMentionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualMentionReviewViews([item, item]).length, 2, "views");
});
