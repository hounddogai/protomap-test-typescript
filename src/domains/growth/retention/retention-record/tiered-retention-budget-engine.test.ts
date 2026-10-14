import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRetentionBudgetEngine } from "./tiered-retention-budget-engine.js";
import { newTieredRetentionBudget } from "./tiered-retention-budget.js";

test("TieredRetentionBudgetEngine keeps results within bounds", () => {
  const engine = defaultTieredRetentionBudgetEngine();
  const item = newTieredRetentionBudget("code-340", "label-638");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
