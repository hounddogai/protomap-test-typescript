import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingCohortPlanEngine } from "./rolling-cohort-plan-engine.js";
import { newRollingCohortPlan } from "./rolling-cohort-plan.js";

test("RollingCohortPlanEngine keeps results within bounds", () => {
  const engine = defaultRollingCohortPlanEngine(flags.newRegistry());
  const item = newRollingCohortPlan("code-856", "label-281");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
