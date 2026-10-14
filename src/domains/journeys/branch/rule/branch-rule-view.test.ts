import assert from "node:assert/strict";
import { test } from "node:test";
import { toBranchRuleView, toBranchRuleViews } from "./branch-rule-view.js";
import { newBranchRule } from "./branch-rule.js";

test("BranchRuleView shows the status in capitals", () => {
  const item = newBranchRule("code-792", "title-906");
  const view = toBranchRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBranchRuleViews([item, item]).length, 2, "views");
});
