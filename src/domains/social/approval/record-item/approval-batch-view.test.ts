import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalBatchView, toApprovalBatchViews } from "./approval-batch-view.js";
import { newApprovalBatch } from "./approval-batch.js";

test("ApprovalBatchView shows the status in capitals", () => {
  const item = newApprovalBatch("code-394", "name-51");
  const view = toApprovalBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalBatchViews([item, item]).length, 2, "views");
});
