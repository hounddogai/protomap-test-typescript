import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionReviewView, toMentionReviewViews } from "./mention-review-view.js";
import { newMentionReview } from "./mention-review.js";

test("MentionReviewView shows the status in capitals", () => {
  const item = newMentionReview("code-146", "label-604");
  const view = toMentionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionReviewViews([item, item]).length, 2, "views");
});
