import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFlightBudgetView, toRollingFlightBudgetViews } from "./rolling-flight-budget-view.js";
import { newRollingFlightBudget } from "./rolling-flight-budget.js";

test("RollingFlightBudgetView shows the status in capitals", () => {
  const item = newRollingFlightBudget("code-3", "label-82");
  const view = toRollingFlightBudgetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFlightBudgetViews([item, item]).length, 2, "views");
});
