import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPlacementAuditView, toLegacyPlacementAuditViews } from "./legacy-placement-audit-view.js";
import { newLegacyPlacementAudit } from "./legacy-placement-audit.js";

test("LegacyPlacementAuditView shows the status in capitals", () => {
  const item = newLegacyPlacementAudit("code-273", "label-313");
  const view = toLegacyPlacementAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPlacementAuditViews([item, item]).length, 2, "views");
});
