import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallBudgetEngine } from "./paywall-budget-engine.js";
import { newPaywallBudget } from "./paywall-budget.js";

test("PaywallBudgetEngine keeps results within bounds", () => {
  const engine = defaultPaywallBudgetEngine(flags.newRegistry());
  const item = newPaywallBudget("code-812", "name-246");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
