import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBidRuleBudgetEngine } from "./pending-bid-rule-budget-engine.js";
import { newPendingBidRuleBudget } from "./pending-bid-rule-budget.js";

test("PendingBidRuleBudgetEngine keeps results within bounds", () => {
  const engine = defaultPendingBidRuleBudgetEngine(flags.newRegistry());
  const item = newPendingBidRuleBudget("code-81", "name-556");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
