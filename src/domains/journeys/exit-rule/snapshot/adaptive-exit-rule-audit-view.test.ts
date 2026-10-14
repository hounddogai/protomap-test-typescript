import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveExitRuleAuditView, toAdaptiveExitRuleAuditViews } from "./adaptive-exit-rule-audit-view.js";
import { newAdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

test("AdaptiveExitRuleAuditView shows the status in capitals", () => {
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  const view = toAdaptiveExitRuleAuditView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveExitRuleAuditViews([item, item]).length, 2, "views");
});
