import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedSlaAuditView, toCappedSlaAuditViews } from "./capped-sla-audit-view.js";
import { newCappedSlaAudit } from "./capped-sla-audit.js";

test("CappedSlaAuditView shows the status in capitals", () => {
  const item = newCappedSlaAudit("code-705", "label-461");
  const view = toCappedSlaAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedSlaAuditViews([item, item]).length, 2, "views");
});
