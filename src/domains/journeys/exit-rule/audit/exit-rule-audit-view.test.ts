import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleAuditView, toExitRuleAuditViews } from "./exit-rule-audit-view.js";
import { newExitRuleAudit } from "./exit-rule-audit.js";

test("ExitRuleAuditView shows the status in capitals", () => {
  const item = newExitRuleAudit("code-579", "name-183");
  const view = toExitRuleAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleAuditViews([item, item]).length, 2, "views");
});
