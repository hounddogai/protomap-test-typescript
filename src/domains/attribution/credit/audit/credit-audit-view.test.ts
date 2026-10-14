import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditAuditView, toCreditAuditViews } from "./credit-audit-view.js";
import { newCreditAudit } from "./credit-audit.js";

test("CreditAuditView shows the status in capitals", () => {
  const item = newCreditAudit("code-200", "label-340");
  const view = toCreditAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditAuditViews([item, item]).length, 2, "views");
});
