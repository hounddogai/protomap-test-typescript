import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationReviewView, toEscalationReviewViews } from "./escalation-review-view.js";
import { newEscalationReview } from "./escalation-review.js";

test("EscalationReviewView shows the status in capitals", () => {
  const item = newEscalationReview("code-844", "title-721");
  const view = toEscalationReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationReviewViews([item, item]).length, 2, "views");
});
