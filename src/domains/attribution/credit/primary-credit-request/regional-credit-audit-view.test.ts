import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalCreditAuditView, toRegionalCreditAuditViews } from "./regional-credit-audit-view.js";
import { newRegionalCreditAudit } from "./regional-credit-audit.js";

test("RegionalCreditAuditView shows the status in capitals", () => {
  const item = newRegionalCreditAudit("code-837", "title-253");
  const view = toRegionalCreditAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalCreditAuditViews([item, item]).length, 2, "views");
});
