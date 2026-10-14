import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalConversionBudgetEngine } from "./global-conversion-budget-engine.js";
import { newGlobalConversionBudget } from "./global-conversion-budget.js";

test("GlobalConversionBudgetEngine keeps results within bounds", () => {
  const engine = defaultGlobalConversionBudgetEngine(flags.newRegistry());
  const item = newGlobalConversionBudget("code-581", "label-792");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
