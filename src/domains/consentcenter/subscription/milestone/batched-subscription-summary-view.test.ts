import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedSubscriptionSummaryView,
  toBatchedSubscriptionSummaryViews,
} from "./batched-subscription-summary-view.js";
import { newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

test("BatchedSubscriptionSummaryView shows the status in capitals", () => {
  const item = newBatchedSubscriptionSummary("code-568", "label-305");
  const view = toBatchedSubscriptionSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedSubscriptionSummaryViews([item, item]).length, 2, "views");
});
