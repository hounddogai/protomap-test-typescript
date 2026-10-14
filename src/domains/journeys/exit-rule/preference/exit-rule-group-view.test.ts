import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleGroupView, toExitRuleGroupViews } from "./exit-rule-group-view.js";
import { newExitRuleGroup } from "./exit-rule-group.js";

test("ExitRuleGroupView shows the status in capitals", () => {
  const item = newExitRuleGroup("code-60", "name-466");
  const view = toExitRuleGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleGroupViews([item, item]).length, 2, "views");
});
