import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleSummaryView, toBidRuleSummaryViews } from "./bid-rule-summary-view.js";
import { newBidRuleSummary } from "./bid-rule-summary.js";

test("BidRuleSummaryView shows the status in capitals", () => {
  const item = newBidRuleSummary("code-867", "name-2");
  const view = toBidRuleSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleSummaryViews([item, item]).length, 2, "views");
});
