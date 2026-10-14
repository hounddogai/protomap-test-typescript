import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingFlightBudgetEngine } from "./rolling-flight-budget-engine.js";
import { newRollingFlightBudget } from "./rolling-flight-budget.js";

test("RollingFlightBudgetEngine keeps results within bounds", () => {
  const engine = defaultRollingFlightBudgetEngine();
  const item = newRollingFlightBudget("code-3", "label-82");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
