import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingExitRuleItemView, toPendingExitRuleItemViews } from "./pending-exit-rule-item-view.js";
import { newPendingExitRuleItem } from "./pending-exit-rule-item.js";

test("PendingExitRuleItemView shows the status in capitals", () => {
  const item = newPendingExitRuleItem("code-741", "label-488");
  const view = toPendingExitRuleItemView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingExitRuleItemViews([item, item]).length, 2, "views");
});
