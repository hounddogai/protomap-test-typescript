import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryTicketViewReviewView, toPrimaryTicketViewReviewViews } from "./primary-ticket-view-review-view.js";
import { newPrimaryTicketViewReview } from "./primary-ticket-view-review.js";

test("PrimaryTicketViewReviewView shows the status in capitals", () => {
  const item = newPrimaryTicketViewReview("code-747", "label-148");
  const view = toPrimaryTicketViewReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTicketViewReviewViews([item, item]).length, 2, "views");
});
