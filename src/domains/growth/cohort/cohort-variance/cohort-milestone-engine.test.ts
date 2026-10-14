import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortMilestoneEngine } from "./cohort-milestone-engine.js";
import { newCohortMilestone } from "./cohort-milestone.js";

test("CohortMilestoneEngine keeps results within bounds", () => {
  const engine = defaultCohortMilestoneEngine();
  const item = newCohortMilestone("code-996", "name-381");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
