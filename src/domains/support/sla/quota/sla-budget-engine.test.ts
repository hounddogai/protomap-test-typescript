import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaBudgetEngine } from "./sla-budget-engine.js";
import { newSlaBudget } from "./sla-budget.js";

test("SlaBudgetEngine keeps results within bounds", () => {
  const engine = defaultSlaBudgetEngine(flags.newRegistry());
  const item = newSlaBudget("code-6", "name-683");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
