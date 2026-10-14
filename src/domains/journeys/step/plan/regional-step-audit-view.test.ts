import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalStepAuditView, toRegionalStepAuditViews } from "./regional-step-audit-view.js";
import { newRegionalStepAudit } from "./regional-step-audit.js";

test("RegionalStepAuditView shows the status in capitals", () => {
  const item = newRegionalStepAudit("code-813", "title-187");
  const view = toRegionalStepAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalStepAuditViews([item, item]).length, 2, "views");
});
