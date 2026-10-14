import assert from "node:assert/strict";
import { test } from "node:test";
import { toPlacementRuleView, toPlacementRuleViews } from "./placement-rule-view.js";
import { newPlacementRule } from "./placement-rule.js";

test("PlacementRuleView shows the status in capitals", () => {
  const item = newPlacementRule("code-137", "label-367");
  const view = toPlacementRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPlacementRuleViews([item, item]).length, 2, "views");
});
