import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientStreakBudgetEngine } from "./lenient-streak-budget-engine.js";
import { newLenientStreakBudget } from "./lenient-streak-budget.js";

test("LenientStreakBudgetEngine keeps results within bounds", () => {
  const engine = defaultLenientStreakBudgetEngine();
  const item = newLenientStreakBudget("code-63", "title-894");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
