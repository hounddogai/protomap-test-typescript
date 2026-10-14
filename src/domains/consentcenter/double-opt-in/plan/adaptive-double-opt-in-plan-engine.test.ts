import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveDoubleOptInPlanEngine } from "./adaptive-double-opt-in-plan-engine.js";
import { newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("AdaptiveDoubleOptInPlanEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDoubleOptInPlanEngine(flags.newRegistry());
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
