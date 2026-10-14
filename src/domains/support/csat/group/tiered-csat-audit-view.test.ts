import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCsatAuditView, toTieredCsatAuditViews } from "./tiered-csat-audit-view.js";
import { newTieredCsatAudit } from "./tiered-csat-audit.js";

test("TieredCsatAuditView shows the status in capitals", () => {
  const item = newTieredCsatAudit("code-173", "title-134");
  const view = toTieredCsatAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCsatAuditViews([item, item]).length, 2, "views");
});
