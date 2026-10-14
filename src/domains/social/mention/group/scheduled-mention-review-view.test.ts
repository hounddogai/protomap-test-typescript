import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledMentionReviewView, toScheduledMentionReviewViews } from "./scheduled-mention-review-view.js";
import { newScheduledMentionReview } from "./scheduled-mention-review.js";

test("ScheduledMentionReviewView shows the status in capitals", () => {
  const item = newScheduledMentionReview("code-320", "title-328");
  const view = toScheduledMentionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMentionReviewViews([item, item]).length, 2, "views");
});
