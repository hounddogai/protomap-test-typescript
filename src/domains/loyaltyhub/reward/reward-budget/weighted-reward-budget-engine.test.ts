import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedRewardBudgetEngine } from "./weighted-reward-budget-engine.js";
import { newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("WeightedRewardBudgetEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardBudgetEngine(flags.newRegistry());
  const item = newWeightedRewardBudget("code-56", "name-844");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
