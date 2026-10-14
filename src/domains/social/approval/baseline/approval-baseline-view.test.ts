import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalBaselineView, toApprovalBaselineViews } from "./approval-baseline-view.js";
import { newApprovalBaseline } from "./approval-baseline.js";

test("ApprovalBaselineView shows the status in capitals", () => {
  const item = newApprovalBaseline("code-678", "name-95");
  const view = toApprovalBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalBaselineViews([item, item]).length, 2, "views");
});
