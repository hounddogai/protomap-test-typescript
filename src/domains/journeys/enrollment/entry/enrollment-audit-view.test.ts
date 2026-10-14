import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentAuditView, toEnrollmentAuditViews } from "./enrollment-audit-view.js";
import { newEnrollmentAudit } from "./enrollment-audit.js";

test("EnrollmentAuditView shows the status in capitals", () => {
  const item = newEnrollmentAudit("code-549", "name-56");
  const view = toEnrollmentAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentAuditViews([item, item]).length, 2, "views");
});
