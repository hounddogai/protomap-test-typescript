import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalDomainAuditView, toSeasonalDomainAuditViews } from "./seasonal-domain-audit-view.js";
import { newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("SeasonalDomainAuditView shows the status in capitals", () => {
  const item = newSeasonalDomainAudit("code-258", "title-312");
  const view = toSeasonalDomainAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDomainAuditViews([item, item]).length, 2, "views");
});
