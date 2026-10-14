import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryApprovalSummaryView, toPrimaryApprovalSummaryViews } from "./primary-approval-summary-view.js";
import { newPrimaryApprovalSummary } from "./primary-approval-summary.js";

test("PrimaryApprovalSummaryView shows the status in capitals", () => {
  const item = newPrimaryApprovalSummary("code-350", "label-558");
  const view = toPrimaryApprovalSummaryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryApprovalSummaryViews([item, item]).length, 2, "views");
});
