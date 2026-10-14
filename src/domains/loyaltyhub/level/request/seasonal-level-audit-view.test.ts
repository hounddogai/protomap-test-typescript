import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalLevelAuditView, toSeasonalLevelAuditViews } from "./seasonal-level-audit-view.js";
import { newSeasonalLevelAudit } from "./seasonal-level-audit.js";

test("SeasonalLevelAuditView shows the status in capitals", () => {
  const item = newSeasonalLevelAudit("code-504", "name-618");
  const view = toSeasonalLevelAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLevelAuditViews([item, item]).length, 2, "views");
});
