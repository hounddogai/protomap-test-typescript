import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

test("AdaptiveEnrollmentPlan starts in planned", () => {
  const item = newAdaptiveEnrollmentPlan("code-769", "name-927");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveEnrollmentPlan moves to scheduled", () => {
  const item = newAdaptiveEnrollmentPlan("code-769", "name-927");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveEnrollmentPlan rejects moves from cancelled", () => {
  const item = newAdaptiveEnrollmentPlan("code-769", "name-927");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
