import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleBudgetEngine } from "./bid-rule-budget-engine.js";
import { newBidRuleBudget } from "./bid-rule-budget.js";

test("BidRuleBudgetEngine keeps results within bounds", () => {
  const engine = defaultBidRuleBudgetEngine();
  const item = newBidRuleBudget("code-821", "title-316");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
