import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredInviteAuditView, toTieredInviteAuditViews } from "./tiered-invite-audit-view.js";
import { newTieredInviteAudit } from "./tiered-invite-audit.js";

test("TieredInviteAuditView shows the status in capitals", () => {
  const item = newTieredInviteAudit("code-469", "title-237");
  const view = toTieredInviteAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredInviteAuditViews([item, item]).length, 2, "views");
});
