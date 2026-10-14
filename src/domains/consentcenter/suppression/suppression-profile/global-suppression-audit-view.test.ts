import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalSuppressionAuditView, toGlobalSuppressionAuditViews } from "./global-suppression-audit-view.js";
import { newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("GlobalSuppressionAuditView shows the status in capitals", () => {
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  const view = toGlobalSuppressionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalSuppressionAuditViews([item, item]).length, 2, "views");
});
