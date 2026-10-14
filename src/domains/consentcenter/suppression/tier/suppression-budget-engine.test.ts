import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionBudgetEngine } from "./suppression-budget-engine.js";
import { newSuppressionBudget } from "./suppression-budget.js";

test("SuppressionBudgetEngine keeps results within bounds", () => {
  const engine = defaultSuppressionBudgetEngine(flags.newRegistry());
  const item = newSuppressionBudget("code-81", "label-358");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
