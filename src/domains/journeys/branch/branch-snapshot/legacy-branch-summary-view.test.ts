import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBranchSummaryView, toLegacyBranchSummaryViews } from "./legacy-branch-summary-view.js";
import { newLegacyBranchSummary } from "./legacy-branch-summary.js";

test("LegacyBranchSummaryView shows the status in capitals", () => {
  const item = newLegacyBranchSummary("code-879", "label-806");
  const view = toLegacyBranchSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBranchSummaryViews([item, item]).length, 2, "views");
});
