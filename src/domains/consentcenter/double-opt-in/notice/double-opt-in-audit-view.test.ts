import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInAuditView, toDoubleOptInAuditViews } from "./double-opt-in-audit-view.js";
import { newDoubleOptInAudit } from "./double-opt-in-audit.js";

test("DoubleOptInAuditView shows the status in capitals", () => {
  const item = newDoubleOptInAudit("code-335", "label-429");
  const view = toDoubleOptInAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInAuditViews([item, item]).length, 2, "views");
});
