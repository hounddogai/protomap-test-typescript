import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredDomainBudgetEngine } from "./tiered-domain-budget-engine.js";
import { newTieredDomainBudget } from "./tiered-domain-budget.js";

test("TieredDomainBudgetEngine keeps results within bounds", () => {
  const engine = defaultTieredDomainBudgetEngine();
  const item = newTieredDomainBudget("code-904", "name-500");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
