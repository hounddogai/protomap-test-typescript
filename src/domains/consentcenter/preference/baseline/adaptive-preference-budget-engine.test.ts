import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePreferenceBudgetEngine } from "./adaptive-preference-budget-engine.js";
import { newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

test("AdaptivePreferenceBudgetEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePreferenceBudgetEngine();
  const item = newAdaptivePreferenceBudget("code-926", "label-767");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
