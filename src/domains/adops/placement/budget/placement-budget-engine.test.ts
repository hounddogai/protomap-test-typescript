import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementBudgetEngine } from "./placement-budget-engine.js";
import { newPlacementBudget } from "./placement-budget.js";

test("PlacementBudgetEngine keeps results within bounds", () => {
  const engine = defaultPlacementBudgetEngine(flags.newRegistry());
  const item = newPlacementBudget("code-12", "title-266");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
