import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionAuditView, toMentionAuditViews } from "./mention-audit-view.js";
import { newMentionAudit } from "./mention-audit.js";

test("MentionAuditView shows the status in capitals", () => {
  const item = newMentionAudit("code-188", "label-939");
  const view = toMentionAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionAuditViews([item, item]).length, 2, "views");
});
