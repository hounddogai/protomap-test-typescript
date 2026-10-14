import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveCreditBudgetEngine } from "./adaptive-credit-budget-engine.js";
import { newAdaptiveCreditBudget } from "./adaptive-credit-budget.js";

test("AdaptiveCreditBudgetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveCreditBudgetEngine(flags.newRegistry());
  const item = newAdaptiveCreditBudget("code-353", "title-284");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
