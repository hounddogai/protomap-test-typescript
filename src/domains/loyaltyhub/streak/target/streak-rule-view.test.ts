import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakRuleView, toStreakRuleViews } from "./streak-rule-view.js";
import { newStreakRule } from "./streak-rule.js";

test("StreakRuleView shows the status in capitals", () => {
  const item = newStreakRule("code-470", "label-975");
  const view = toStreakRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakRuleViews([item, item]).length, 2, "views");
});
