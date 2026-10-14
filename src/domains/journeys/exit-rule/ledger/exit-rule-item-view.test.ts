import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleItemView, toExitRuleItemViews } from "./exit-rule-item-view.js";
import { newExitRuleItem } from "./exit-rule-item.js";

test("ExitRuleItemView shows the status in capitals", () => {
  const item = newExitRuleItem("code-530", "label-890");
  const view = toExitRuleItemView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleItemViews([item, item]).length, 2, "views");
});
