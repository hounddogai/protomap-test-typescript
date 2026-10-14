import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveRedemptionPlanEngine } from "./adaptive-redemption-plan-engine.js";
import { newAdaptiveRedemptionPlan } from "./adaptive-redemption-plan.js";

test("AdaptiveRedemptionPlanEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveRedemptionPlanEngine(flags.newRegistry());
  const item = newAdaptiveRedemptionPlan("code-319", "title-782");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
