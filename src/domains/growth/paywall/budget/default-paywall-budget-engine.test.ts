import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPaywallBudgetEngine } from "./default-paywall-budget-engine.js";
import { newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("DefaultPaywallBudgetEngine keeps results within bounds", () => {
  const engine = defaultDefaultPaywallBudgetEngine(flags.newRegistry());
  const item = newDefaultPaywallBudget("code-66", "name-545");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
