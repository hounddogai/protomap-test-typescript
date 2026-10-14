import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutAuditView, toPayoutAuditViews } from "./payout-audit-view.js";
import { newPayoutAudit } from "./payout-audit.js";

test("PayoutAuditView shows the status in capitals", () => {
  const item = newPayoutAudit("code-240", "name-446");
  const view = toPayoutAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutAuditViews([item, item]).length, 2, "views");
});
