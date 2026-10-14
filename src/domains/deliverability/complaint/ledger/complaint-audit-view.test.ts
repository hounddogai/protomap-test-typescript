import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintAuditView, toComplaintAuditViews } from "./complaint-audit-view.js";
import { newComplaintAudit } from "./complaint-audit.js";

test("ComplaintAuditView shows the status in capitals", () => {
  const item = newComplaintAudit("code-247", "label-233");
  const view = toComplaintAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintAuditViews([item, item]).length, 2, "views");
});
