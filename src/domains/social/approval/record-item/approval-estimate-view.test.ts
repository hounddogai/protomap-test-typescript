import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalEstimateView, toApprovalEstimateViews } from "./approval-estimate-view.js";
import { newApprovalEstimate } from "./approval-estimate.js";

test("ApprovalEstimateView shows the status in capitals", () => {
  const item = newApprovalEstimate("code-874", "name-26");
  const view = toApprovalEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalEstimateViews([item, item]).length, 2, "views");
});
