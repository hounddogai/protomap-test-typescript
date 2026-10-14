import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCsatRuleView, toRollingCsatRuleViews } from "./rolling-csat-rule-view.js";
import { newRollingCsatRule } from "./rolling-csat-rule.js";

test("RollingCsatRuleView shows the status in capitals", () => {
  const item = newRollingCsatRule("code-258", "name-721");
  const view = toRollingCsatRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCsatRuleViews([item, item]).length, 2, "views");
});
