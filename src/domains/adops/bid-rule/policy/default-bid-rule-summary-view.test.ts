import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultBidRuleSummaryView, toDefaultBidRuleSummaryViews } from "./default-bid-rule-summary-view.js";
import { newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

test("DefaultBidRuleSummaryView shows the status in capitals", () => {
  const item = newDefaultBidRuleSummary("code-244", "label-869");
  const view = toDefaultBidRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultBidRuleSummaryViews([item, item]).length, 2, "views");
});
