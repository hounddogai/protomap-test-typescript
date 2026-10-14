import assert from "node:assert/strict";
import { test } from "node:test";
import { toReputationAuditView, toReputationAuditViews } from "./reputation-audit-view.js";
import { newReputationAudit } from "./reputation-audit.js";

test("ReputationAuditView shows the status in capitals", () => {
  const item = newReputationAudit("code-593", "name-624");
  const view = toReputationAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReputationAuditViews([item, item]).length, 2, "views");
});
