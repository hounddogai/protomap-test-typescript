import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackSuppressionAuditView,
  toFallbackSuppressionAuditViews,
} from "./fallback-suppression-audit-view.js";
import { newFallbackSuppressionAudit } from "./fallback-suppression-audit.js";

test("FallbackSuppressionAuditView shows the status in capitals", () => {
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  const view = toFallbackSuppressionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSuppressionAuditViews([item, item]).length, 2, "views");
});
