import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackReplyBudgetEngine } from "./fallback-reply-budget-engine.js";
import { newFallbackReplyBudget } from "./fallback-reply-budget.js";

test("FallbackReplyBudgetEngine keeps results within bounds", () => {
  const engine = defaultFallbackReplyBudgetEngine();
  const item = newFallbackReplyBudget("code-530", "name-152");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
