import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionBudgetEngine } from "./redemption-budget-engine.js";
import { newRedemptionBudget } from "./redemption-budget.js";

test("RedemptionBudgetEngine keeps results within bounds", () => {
  const engine = defaultRedemptionBudgetEngine(flags.newRegistry());
  const item = newRedemptionBudget("code-508", "title-345");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
