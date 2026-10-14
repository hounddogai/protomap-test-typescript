import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingCohortMilestoneEngine } from "./rolling-cohort-milestone-engine.js";
import { newRollingCohortMilestone } from "./rolling-cohort-milestone.js";

test("RollingCohortMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRollingCohortMilestoneEngine();
  const item = newRollingCohortMilestone("code-38", "title-624");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
