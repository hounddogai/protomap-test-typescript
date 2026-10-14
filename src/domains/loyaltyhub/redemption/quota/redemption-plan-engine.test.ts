import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionPlanEngine } from "./redemption-plan-engine.js";
import { newRedemptionPlan } from "./redemption-plan.js";

test("RedemptionPlanEngine keeps results within bounds", () => {
  const engine = defaultRedemptionPlanEngine(flags.newRegistry());
  const item = newRedemptionPlan("code-19", "name-507");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
