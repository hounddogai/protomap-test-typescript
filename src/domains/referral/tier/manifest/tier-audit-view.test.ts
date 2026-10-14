import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierAuditView, toTierAuditViews } from "./tier-audit-view.js";
import { newTierAudit } from "./tier-audit.js";

test("TierAuditView shows the status in capitals", () => {
  const item = newTierAudit("code-808", "title-135");
  const view = toTierAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierAuditViews([item, item]).length, 2, "views");
});
