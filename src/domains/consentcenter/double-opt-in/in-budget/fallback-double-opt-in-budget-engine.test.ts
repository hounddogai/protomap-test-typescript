import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackDoubleOptInBudgetEngine } from "./fallback-double-opt-in-budget-engine.js";
import { newFallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

test("FallbackDoubleOptInBudgetEngine keeps results within bounds", () => {
  const engine = defaultFallbackDoubleOptInBudgetEngine();
  const item = newFallbackDoubleOptInBudget("code-316", "name-326");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
