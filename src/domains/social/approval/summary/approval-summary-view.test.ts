import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalSummaryView, toApprovalSummaryViews } from "./approval-summary-view.js";
import { newApprovalSummary } from "./approval-summary.js";

test("ApprovalSummaryView shows the status in capitals", () => {
  const item = newApprovalSummary("code-621", "title-345");
  const view = toApprovalSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalSummaryViews([item, item]).length, 2, "views");
});
