import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedRewardSummaryView, toCappedRewardSummaryViews } from "./capped-reward-summary-view.js";
import { newCappedRewardSummary } from "./capped-reward-summary.js";

test("CappedRewardSummaryView shows the status in capitals", () => {
  const item = newCappedRewardSummary("code-246", "label-466");
  const view = toCappedRewardSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedRewardSummaryViews([item, item]).length, 2, "views");
});
