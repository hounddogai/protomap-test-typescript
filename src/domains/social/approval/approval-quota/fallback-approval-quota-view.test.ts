import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackApprovalQuotaView, toFallbackApprovalQuotaViews } from "./fallback-approval-quota-view.js";
import { newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("FallbackApprovalQuotaView shows the status in capitals", () => {
  const item = newFallbackApprovalQuota("code-958", "name-369");
  const view = toFallbackApprovalQuotaView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackApprovalQuotaViews([item, item]).length, 2, "views");
});
