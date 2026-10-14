import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualCreativeAuditView, toManualCreativeAuditViews } from "./manual-creative-audit-view.js";
import { newManualCreativeAudit } from "./manual-creative-audit.js";

test("ManualCreativeAuditView shows the status in capitals", () => {
  const item = newManualCreativeAudit("code-926", "title-754");
  const view = toManualCreativeAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualCreativeAuditViews([item, item]).length, 2, "views");
});
