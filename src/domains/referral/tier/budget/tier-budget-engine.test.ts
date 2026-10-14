import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierBudgetEngine } from "./tier-budget-engine.js";
import { newTierBudget } from "./tier-budget.js";

test("TierBudgetEngine keeps results within bounds", () => {
  const engine = defaultTierBudgetEngine(flags.newRegistry());
  const item = newTierBudget("code-613", "label-303");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
