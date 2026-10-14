import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryReplyBudgetEngine } from "./primary-reply-budget-engine.js";
import { newPrimaryReplyBudget } from "./primary-reply-budget.js";

test("PrimaryReplyBudgetEngine keeps results within bounds", () => {
  const engine = defaultPrimaryReplyBudgetEngine(flags.newRegistry());
  const item = newPrimaryReplyBudget("code-647", "title-908");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
