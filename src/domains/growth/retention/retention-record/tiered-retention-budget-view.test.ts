import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredRetentionBudgetView, toTieredRetentionBudgetViews } from "./tiered-retention-budget-view.js";
import { newTieredRetentionBudget } from "./tiered-retention-budget.js";

test("TieredRetentionBudgetView shows the status in capitals", () => {
  const item = newTieredRetentionBudget("code-340", "label-638");
  const view = toTieredRetentionBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRetentionBudgetViews([item, item]).length, 2, "views");
});
