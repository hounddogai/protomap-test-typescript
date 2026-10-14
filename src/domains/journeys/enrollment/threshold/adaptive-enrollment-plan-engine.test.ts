import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveEnrollmentPlanEngine } from "./adaptive-enrollment-plan-engine.js";
import { newAdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

test("AdaptiveEnrollmentPlanEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentPlanEngine(flags.newRegistry());
  const item = newAdaptiveEnrollmentPlan("code-769", "name-927");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
