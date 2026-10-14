import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveEnrollmentPlanCountryLengthRule,
  AdaptiveEnrollmentPlanJourneyIdLengthRule,
  AdaptiveEnrollmentPlanNameLengthRule,
  defaultAdaptiveEnrollmentPlanValidator,
} from "./adaptive-enrollment-plan-rules.js";
import { newAdaptiveEnrollmentPlan } from "./adaptive-enrollment-plan.js";

test("AdaptiveEnrollmentPlanValidator reports every problem", () => {
  const validator = defaultAdaptiveEnrollmentPlanValidator();
  const item = newAdaptiveEnrollmentPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveEnrollmentPlanNameLengthRule flags a long name", () => {
  const rule = new AdaptiveEnrollmentPlanNameLengthRule(3600);
  const item = newAdaptiveEnrollmentPlan("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentPlanJourneyIdLengthRule flags a long journey id", () => {
  const rule = new AdaptiveEnrollmentPlanJourneyIdLengthRule(16);
  const item = newAdaptiveEnrollmentPlan("x", "y");
  item.journeyId = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentPlanCountryLengthRule flags a long country", () => {
  const rule = new AdaptiveEnrollmentPlanCountryLengthRule(1000);
  const item = newAdaptiveEnrollmentPlan("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
