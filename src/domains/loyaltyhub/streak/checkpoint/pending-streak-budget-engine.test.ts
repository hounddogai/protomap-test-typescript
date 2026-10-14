import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingStreakBudgetEngine } from "./pending-streak-budget-engine.js";
import { newPendingStreakBudget } from "./pending-streak-budget.js";

test("PendingStreakBudgetEngine keeps results within bounds", () => {
  const engine = defaultPendingStreakBudgetEngine();
  const item = newPendingStreakBudget("code-88", "title-946");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
