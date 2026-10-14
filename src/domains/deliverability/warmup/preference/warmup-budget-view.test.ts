import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupBudgetView, toWarmupBudgetViews } from "./warmup-budget-view.js";
import { newWarmupBudget } from "./warmup-budget.js";

test("WarmupBudgetView shows the status in capitals", () => {
  const item = newWarmupBudget("code-317", "label-118");
  const view = toWarmupBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupBudgetViews([item, item]).length, 2, "views");
});
