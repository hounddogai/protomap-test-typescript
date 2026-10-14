import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingRetentionAuditView, toPendingRetentionAuditViews } from "./pending-retention-audit-view.js";
import { newPendingRetentionAudit } from "./pending-retention-audit.js";

test("PendingRetentionAuditView shows the status in capitals", () => {
  const item = newPendingRetentionAudit("code-565", "title-312");
  const view = toPendingRetentionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingRetentionAuditViews([item, item]).length, 2, "views");
});
