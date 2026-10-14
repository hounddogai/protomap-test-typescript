import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementAuditView, toPlacementAuditViews } from "./placement-audit-view.js";
import { newPlacementAudit } from "./placement-audit.js";

test("PlacementAuditView shows the status in capitals", () => {
  const item = newPlacementAudit("code-963", "name-826");
  const view = toPlacementAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementAuditViews([item, item]).length, 2, "views");
});
