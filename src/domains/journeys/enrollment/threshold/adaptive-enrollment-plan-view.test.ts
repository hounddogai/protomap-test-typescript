import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveEnrollmentPlanView, toAdaptiveEnrollmentPlanViews } from "./adaptive-enrollment-plan-view.js";
import { newAdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

test("AdaptiveEnrollmentPlanView shows the status in capitals", () => {
  const item = newAdaptiveEnrollmentPlan("code-769", "name-927");
  const view = toAdaptiveEnrollmentPlanView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveEnrollmentPlanViews([item, item]).length, 2, "views");
});
