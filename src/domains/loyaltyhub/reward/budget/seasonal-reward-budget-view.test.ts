import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalRewardBudgetView, toSeasonalRewardBudgetViews } from "./seasonal-reward-budget-view.js";
import { newSeasonalRewardBudget } from "./seasonal-reward-budget.js";

test("SeasonalRewardBudgetView shows the status in capitals", () => {
  const item = newSeasonalRewardBudget("code-488", "label-301");
  const view = toSeasonalRewardBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalRewardBudgetViews([item, item]).length, 2, "views");
});
