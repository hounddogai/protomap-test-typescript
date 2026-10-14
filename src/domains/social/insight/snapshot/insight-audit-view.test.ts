import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightAuditView, toInsightAuditViews } from "./insight-audit-view.js";
import { newInsightAudit } from "./insight-audit.js";

test("InsightAuditView shows the status in capitals", () => {
  const item = newInsightAudit("code-823", "name-873");
  const view = toInsightAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightAuditViews([item, item]).length, 2, "views");
});
