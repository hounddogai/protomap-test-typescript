import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutBudgetEngine } from "./payout-budget-engine.js";
import { newPayoutBudget } from "./payout-budget.js";

test("PayoutBudgetEngine keeps results within bounds", () => {
  const engine = defaultPayoutBudgetEngine(flags.newRegistry());
  const item = newPayoutBudget("code-179", "name-10");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
