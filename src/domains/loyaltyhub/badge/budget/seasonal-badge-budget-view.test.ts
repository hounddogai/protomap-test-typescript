import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalBadgeBudgetView, toSeasonalBadgeBudgetViews } from "./seasonal-badge-budget-view.js";
import { newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

test("SeasonalBadgeBudgetView shows the status in capitals", () => {
  const item = newSeasonalBadgeBudget("code-612", "label-702");
  const view = toSeasonalBadgeBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalBadgeBudgetViews([item, item]).length, 2, "views");
});
