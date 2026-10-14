import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingReplyAuditView, toPendingReplyAuditViews } from "./pending-reply-audit-view.js";
import { newPendingReplyAudit } from "./pending-reply-audit.js";

test("PendingReplyAuditView shows the status in capitals", () => {
  const item = newPendingReplyAudit("code-78", "name-571");
  const view = toPendingReplyAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingReplyAuditViews([item, item]).length, 2, "views");
});
