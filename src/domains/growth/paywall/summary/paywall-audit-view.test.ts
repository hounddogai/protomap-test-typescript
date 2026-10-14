import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallAuditView, toPaywallAuditViews } from "./paywall-audit-view.js";
import { newPaywallAudit } from "./paywall-audit.js";

test("PaywallAuditView shows the status in capitals", () => {
  const item = newPaywallAudit("code-320", "label-227");
  const view = toPaywallAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallAuditViews([item, item]).length, 2, "views");
});
