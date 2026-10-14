import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientTicketViewReviewView, toLenientTicketViewReviewViews } from "./lenient-ticket-view-review-view.js";
import { newLenientTicketViewReview } from "./lenient-ticket-view-review.js";

test("LenientTicketViewReviewView shows the status in capitals", () => {
  const item = newLenientTicketViewReview("code-474", "name-910");
  const view = toLenientTicketViewReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientTicketViewReviewViews([item, item]).length, 2, "views");
});
