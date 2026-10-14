import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackModelBudgetEngine } from "./fallback-model-budget-engine.js";
import { newFallbackModelBudget } from "./fallback-model-budget.js";

test("FallbackModelBudgetEngine keeps results within bounds", () => {
  const engine = defaultFallbackModelBudgetEngine();
  const item = newFallbackModelBudget("code-443", "label-983");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
