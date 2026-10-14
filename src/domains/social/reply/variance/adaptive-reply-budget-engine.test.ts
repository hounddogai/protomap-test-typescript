import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveReplyBudgetEngine } from "./adaptive-reply-budget-engine.js";
import { newAdaptiveReplyBudget } from "./adaptive-reply-budget.js";

test("AdaptiveReplyBudgetEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveReplyBudgetEngine(flags.newRegistry());
  const item = newAdaptiveReplyBudget("code-142", "name-889");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
