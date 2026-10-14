import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualEscalationReviewView, toManualEscalationReviewViews } from "./manual-escalation-review-view.js";
import { newManualEscalationReview } from "./manual-escalation-review.js";

test("ManualEscalationReviewView shows the status in capitals", () => {
  const item = newManualEscalationReview("code-688", "title-937");
  const view = toManualEscalationReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualEscalationReviewViews([item, item]).length, 2, "views");
});
