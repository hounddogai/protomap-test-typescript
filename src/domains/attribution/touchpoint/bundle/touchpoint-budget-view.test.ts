import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointBudgetView, toTouchpointBudgetViews } from "./touchpoint-budget-view.js";
import { newTouchpointBudget } from "./touchpoint-budget.js";

test("TouchpointBudgetView shows the status in capitals", () => {
  const item = newTouchpointBudget("code-621", "label-280");
  const view = toTouchpointBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointBudgetViews([item, item]).length, 2, "views");
});
