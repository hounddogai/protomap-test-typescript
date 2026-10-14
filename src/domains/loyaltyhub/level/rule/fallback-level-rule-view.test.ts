import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackLevelRuleView, toFallbackLevelRuleViews } from "./fallback-level-rule-view.js";
import { newFallbackLevelRule } from "./fallback-level-rule.js";

test("FallbackLevelRuleView shows the status in capitals", () => {
  const item = newFallbackLevelRule("code-642", "label-513");
  const view = toFallbackLevelRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackLevelRuleViews([item, item]).length, 2, "views");
});
