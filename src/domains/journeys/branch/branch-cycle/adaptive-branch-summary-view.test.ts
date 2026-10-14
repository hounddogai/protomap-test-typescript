import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveBranchSummaryView, toAdaptiveBranchSummaryViews } from "./adaptive-branch-summary-view.js";
import { newAdaptiveBranchSummary } from "./adaptive-branch-summary.js";

test("AdaptiveBranchSummaryView shows the status in capitals", () => {
  const item = newAdaptiveBranchSummary("code-536", "label-540");
  const view = toAdaptiveBranchSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveBranchSummaryViews([item, item]).length, 2, "views");
});
