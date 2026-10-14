import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingBadgeAuditView, toPendingBadgeAuditViews } from "./pending-badge-audit-view.js";
import { newPendingBadgeAudit } from "./pending-badge-audit.js";

test("PendingBadgeAuditView shows the status in capitals", () => {
  const item = newPendingBadgeAudit("code-965", "title-598");
  const view = toPendingBadgeAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingBadgeAuditViews([item, item]).length, 2, "views");
});
