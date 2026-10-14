import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedBidRuleSummaryView, toBatchedBidRuleSummaryViews } from "./batched-bid-rule-summary-view.js";
import { newBatchedBidRuleSummary } from "./batched-bid-rule-summary.js";

test("BatchedBidRuleSummaryView shows the status in capitals", () => {
  const item = newBatchedBidRuleSummary("code-377", "name-565");
  const view = toBatchedBidRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedBidRuleSummaryViews([item, item]).length, 2, "views");
});
