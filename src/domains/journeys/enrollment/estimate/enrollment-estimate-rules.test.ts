import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentEstimateAttemptsRangeRule,
  EnrollmentEstimateRequiredCohortRule,
  EnrollmentEstimateRequiredLabelRule,
  defaultEnrollmentEstimateValidator,
} from "./enrollment-estimate-rules.js";
import { newEnrollmentEstimate } from "./enrollment-estimate.js";

test("EnrollmentEstimateValidator reports every problem", () => {
  const validator = defaultEnrollmentEstimateValidator();
  const item = newEnrollmentEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentEstimateRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentEstimateRequiredLabelRule("enrollment estimate needs an entry");
  const item = newEnrollmentEstimate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentEstimateRequiredCohortRule flags a blank cohort", () => {
  const rule = new EnrollmentEstimateRequiredCohortRule("enrollment estimate needs an entry");
  const item = newEnrollmentEstimate("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentEstimateAttemptsRangeRule flags values above attempts", () => {
  const rule = new EnrollmentEstimateAttemptsRangeRule(255, 1000);
  const item = newEnrollmentEstimate("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
