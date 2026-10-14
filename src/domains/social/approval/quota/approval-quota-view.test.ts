import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalQuotaView, toApprovalQuotaViews } from "./approval-quota-view.js";
import { newApprovalQuota } from "./approval-quota.js";

test("ApprovalQuotaView shows the status in capitals", () => {
  const item = newApprovalQuota("code-648", "label-208");
  const view = toApprovalQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalQuotaViews([item, item]).length, 2, "views");
});
