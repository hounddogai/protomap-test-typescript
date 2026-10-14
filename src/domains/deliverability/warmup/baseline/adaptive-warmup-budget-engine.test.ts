import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveWarmupBudgetEngine } from "./adaptive-warmup-budget-engine.js";
import { newAdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

test("AdaptiveWarmupBudgetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveWarmupBudgetEngine(flags.newRegistry());
  const item = newAdaptiveWarmupBudget("code-927", "label-939");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
