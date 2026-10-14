import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredCohortAuditView, toTieredCohortAuditViews } from "./tiered-cohort-audit-view.js";
import { newTieredCohortAudit } from "./tiered-cohort-audit.js";

test("TieredCohortAuditView shows the status in capitals", () => {
  const item = newTieredCohortAudit("code-733", "label-592");
  const view = toTieredCohortAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredCohortAuditViews([item, item]).length, 2, "views");
});
