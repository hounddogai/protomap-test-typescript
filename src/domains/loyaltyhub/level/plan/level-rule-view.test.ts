import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelRuleView, toLevelRuleViews } from "./level-rule-view.js";
import { newLevelRule } from "./level-rule.js";

test("LevelRuleView shows the status in capitals", () => {
  const item = newLevelRule("code-806", "label-546");
  const view = toLevelRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelRuleViews([item, item]).length, 2, "views");
});
