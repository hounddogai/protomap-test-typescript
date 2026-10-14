import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionAuditView, toSuppressionAuditViews } from "./suppression-audit-view.js";
import { newSuppressionAudit } from "./suppression-audit.js";

test("SuppressionAuditView shows the status in capitals", () => {
  const item = newSuppressionAudit("code-40", "label-928");
  const view = toSuppressionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionAuditViews([item, item]).length, 2, "views");
});
