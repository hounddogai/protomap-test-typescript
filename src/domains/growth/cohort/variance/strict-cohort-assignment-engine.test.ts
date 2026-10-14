import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictCohortAssignmentEngine } from "./strict-cohort-assignment-engine.js";
import { newStrictCohortAssignment } from "./strict-cohort-assignment.js";

test("StrictCohortAssignmentEngine keeps results within bounds", () => {
  const engine = defaultStrictCohortAssignmentEngine();
  const item = newStrictCohortAssignment("code-768", "name-126");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
