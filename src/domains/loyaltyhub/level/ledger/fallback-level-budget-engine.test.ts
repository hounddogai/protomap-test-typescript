import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackLevelBudgetEngine } from "./fallback-level-budget-engine.js";
import { newFallbackLevelBudget } from "./fallback-level-budget.js";

test("FallbackLevelBudgetEngine keeps results within bounds", () => {
  const engine = defaultFallbackLevelBudgetEngine();
  const item = newFallbackLevelBudget("code-750", "name-832");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
