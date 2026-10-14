import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedRewardRuleBudgetEngine } from "./weighted-reward-rule-budget-engine.js";
import { newWeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

test("WeightedRewardRuleBudgetEngine keeps results within bounds", () => {
  const engine = defaultWeightedRewardRuleBudgetEngine(flags.newRegistry());
  const item = newWeightedRewardRuleBudget("code-717", "title-10");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
