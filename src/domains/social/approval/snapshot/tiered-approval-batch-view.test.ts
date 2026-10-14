import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredApprovalBatchView, toTieredApprovalBatchViews } from "./tiered-approval-batch-view.js";
import { newTieredApprovalBatch } from "./tiered-approval-batch.js";

test("TieredApprovalBatchView shows the status in capitals", () => {
  const item = newTieredApprovalBatch("code-64", "name-333");
  const view = toTieredApprovalBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredApprovalBatchViews([item, item]).length, 2, "views");
});
