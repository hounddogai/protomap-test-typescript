import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalModelAuditView, toSeasonalModelAuditViews } from "./seasonal-model-audit-view.js";
import { newSeasonalModelAudit } from "./seasonal-model-audit.js";

test("SeasonalModelAuditView shows the status in capitals", () => {
  const item = newSeasonalModelAudit("code-815", "label-662");
  const view = toSeasonalModelAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalModelAuditViews([item, item]).length, 2, "views");
});
