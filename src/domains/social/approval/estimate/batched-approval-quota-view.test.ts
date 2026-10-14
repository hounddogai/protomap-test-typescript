import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedApprovalQuotaView, toBatchedApprovalQuotaViews } from "./batched-approval-quota-view.js";
import { newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("BatchedApprovalQuotaView shows the status in capitals", () => {
  const item = newBatchedApprovalQuota("code-929", "title-128");
  const view = toBatchedApprovalQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedApprovalQuotaViews([item, item]).length, 2, "views");
});
