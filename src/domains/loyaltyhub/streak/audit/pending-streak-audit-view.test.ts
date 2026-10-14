import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingStreakAuditView, toPendingStreakAuditViews } from "./pending-streak-audit-view.js";
import { newPendingStreakAudit } from "./pending-streak-audit.js";

test("PendingStreakAuditView shows the status in capitals", () => {
  const item = newPendingStreakAudit("code-632", "title-833");
  const view = toPendingStreakAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingStreakAuditViews([item, item]).length, 2, "views");
});
