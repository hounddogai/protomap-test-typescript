import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDeflectionBudgetEngine } from "./adaptive-deflection-budget-engine.js";
import { newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("AdaptiveDeflectionBudgetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDeflectionBudgetEngine();
  const item = newAdaptiveDeflectionBudget("code-276", "title-208");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
