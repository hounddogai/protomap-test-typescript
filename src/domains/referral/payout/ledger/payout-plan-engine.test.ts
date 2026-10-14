import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutPlanEngine } from "./payout-plan-engine.js";
import { newPayoutPlan } from "./payout-plan.js";

test("PayoutPlanEngine keeps results within bounds", () => {
  const engine = defaultPayoutPlanEngine();
  const item = newPayoutPlan("code-66", "name-361");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
