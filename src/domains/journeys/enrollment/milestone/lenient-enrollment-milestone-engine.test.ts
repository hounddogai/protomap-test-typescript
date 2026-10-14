import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientEnrollmentMilestoneEngine } from "./lenient-enrollment-milestone-engine.js";
import { newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

test("LenientEnrollmentMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLenientEnrollmentMilestoneEngine();
  const item = newLenientEnrollmentMilestone("code-748", "label-869");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
