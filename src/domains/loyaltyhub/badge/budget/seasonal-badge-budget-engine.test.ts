import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBadgeBudgetEngine } from "./seasonal-badge-budget-engine.js";
import { newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

test("SeasonalBadgeBudgetEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBadgeBudgetEngine();
  const item = newSeasonalBadgeBudget("code-612", "label-702");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
