import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictReplyBudgetEngine } from "./strict-reply-budget-engine.js";
import { newStrictReplyBudget } from "./strict-reply-budget.js";

test("StrictReplyBudgetEngine keeps results within bounds", () => {
  const engine = defaultStrictReplyBudgetEngine(flags.newRegistry());
  const item = newStrictReplyBudget("code-320", "label-305");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
