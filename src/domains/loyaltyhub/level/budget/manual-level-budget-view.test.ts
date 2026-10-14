import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualLevelBudgetView, toManualLevelBudgetViews } from "./manual-level-budget-view.js";
import { newManualLevelBudget } from "./manual-level-budget.js";

test("ManualLevelBudgetView shows the status in capitals", () => {
  const item = newManualLevelBudget("code-479", "title-167");
  const view = toManualLevelBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualLevelBudgetViews([item, item]).length, 2, "views");
});
