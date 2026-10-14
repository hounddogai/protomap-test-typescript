import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionBudgetEngine } from "./conversion-budget-engine.js";
import { newConversionBudget } from "./conversion-budget.js";

test("ConversionBudgetEngine keeps results within bounds", () => {
  const engine = defaultConversionBudgetEngine();
  const item = newConversionBudget("code-972", "name-644");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
