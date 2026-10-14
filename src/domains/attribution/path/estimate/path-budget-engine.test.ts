import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathBudgetEngine } from "./path-budget-engine.js";
import { newPathBudget } from "./path-budget.js";

test("PathBudgetEngine keeps results within bounds", () => {
  const engine = defaultPathBudgetEngine(flags.newRegistry());
  const item = newPathBudget("code-828", "title-402");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
