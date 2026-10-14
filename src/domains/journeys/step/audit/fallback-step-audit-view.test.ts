import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackStepAuditView, toFallbackStepAuditViews } from "./fallback-step-audit-view.js";
import { newFallbackStepAudit } from "./fallback-step-audit.js";

test("FallbackStepAuditView shows the status in capitals", () => {
  const item = newFallbackStepAudit("code-990", "title-649");
  const view = toFallbackStepAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackStepAuditViews([item, item]).length, 2, "views");
});
