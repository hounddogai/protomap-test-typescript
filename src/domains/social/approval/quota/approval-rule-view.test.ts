import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalRuleView, toApprovalRuleViews } from "./approval-rule-view.js";
import { newApprovalRule } from "./approval-rule.js";

test("ApprovalRuleView shows the status in capitals", () => {
  const item = newApprovalRule("code-174", "title-876");
  const view = toApprovalRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalRuleViews([item, item]).length, 2, "views");
});
