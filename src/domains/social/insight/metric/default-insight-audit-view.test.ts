import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultInsightAuditView, toDefaultInsightAuditViews } from "./default-insight-audit-view.js";
import { newDefaultInsightAudit } from "./default-insight-audit.js";

test("DefaultInsightAuditView shows the status in capitals", () => {
  const item = newDefaultInsightAudit("code-55", "title-700");
  const view = toDefaultInsightAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultInsightAuditViews([item, item]).length, 2, "views");
});
