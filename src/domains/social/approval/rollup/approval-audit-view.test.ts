import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalAuditView, toApprovalAuditViews } from "./approval-audit-view.js";
import { newApprovalAudit } from "./approval-audit.js";

test("ApprovalAuditView shows the status in capitals", () => {
  const item = newApprovalAudit("code-94", "name-379");
  const view = toApprovalAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalAuditViews([item, item]).length, 2, "views");
});
