import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceBudgetEngine } from "./preference-budget-engine.js";
import { newPreferenceBudget } from "./preference-budget.js";

test("PreferenceBudgetEngine keeps results within bounds", () => {
  const engine = defaultPreferenceBudgetEngine();
  const item = newPreferenceBudget("code-290", "title-787");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
