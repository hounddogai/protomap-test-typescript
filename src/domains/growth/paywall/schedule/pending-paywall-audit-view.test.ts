import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPaywallAuditView, toPendingPaywallAuditViews } from "./pending-paywall-audit-view.js";
import { newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("PendingPaywallAuditView shows the status in capitals", () => {
  const item = newPendingPaywallAudit("code-896", "label-591");
  const view = toPendingPaywallAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPaywallAuditViews([item, item]).length, 2, "views");
});
