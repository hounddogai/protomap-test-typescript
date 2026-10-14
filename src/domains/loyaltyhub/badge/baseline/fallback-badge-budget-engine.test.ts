import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackBadgeBudgetEngine } from "./fallback-badge-budget-engine.js";
import { newFallbackBadgeBudget } from "./fallback-badge-budget.js";

test("FallbackBadgeBudgetEngine keeps results within bounds", () => {
  const engine = defaultFallbackBadgeBudgetEngine();
  const item = newFallbackBadgeBudget("code-358", "title-964");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
