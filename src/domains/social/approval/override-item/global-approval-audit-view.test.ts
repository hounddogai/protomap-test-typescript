import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalApprovalAuditView, toGlobalApprovalAuditViews } from "./global-approval-audit-view.js";
import { newGlobalApprovalAudit } from "./global-approval-audit.js";

test("GlobalApprovalAuditView shows the status in capitals", () => {
  const item = newGlobalApprovalAudit("code-379", "name-96");
  const view = toGlobalApprovalAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalApprovalAuditViews([item, item]).length, 2, "views");
});
