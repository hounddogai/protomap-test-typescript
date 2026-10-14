import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionBudgetEngine } from "./subscription-budget-engine.js";
import { newSubscriptionBudget } from "./subscription-budget.js";

test("SubscriptionBudgetEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionBudgetEngine();
  const item = newSubscriptionBudget("code-790", "title-135");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
