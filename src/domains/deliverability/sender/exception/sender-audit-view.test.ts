import assert from "node:assert/strict";
import { test } from "node:test";
import { toSenderAuditView, toSenderAuditViews } from "./sender-audit-view.js";
import { newSenderAudit } from "./sender-audit.js";

test("SenderAuditView shows the status in capitals", () => {
  const item = newSenderAudit("code-473", "name-628");
  const view = toSenderAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSenderAuditViews([item, item]).length, 2, "views");
});
