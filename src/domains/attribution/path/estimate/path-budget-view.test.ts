import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathBudgetView, toPathBudgetViews } from "./path-budget-view.js";
import { newPathBudget } from "./path-budget.js";

test("PathBudgetView shows the status in capitals", () => {
  const item = newPathBudget("code-828", "title-402");
  const view = toPathBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathBudgetViews([item, item]).length, 2, "views");
});
