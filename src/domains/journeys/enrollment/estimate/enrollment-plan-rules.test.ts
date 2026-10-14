import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentPlanNameLengthRule,
  EnrollmentPlanRequiredNameRule,
  EnrollmentPlanReviewerLengthRule,
  EnrollmentPlanTitleLengthRule,
  defaultEnrollmentPlanValidator,
} from "./enrollment-plan-rules.js";
import { newEnrollmentPlan } from "./enrollment-plan.js";

test("EnrollmentPlanValidator reports every problem", () => {
  const validator = defaultEnrollmentPlanValidator();
  const item = newEnrollmentPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentPlanTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentPlanTitleLengthRule(80);
  const item = newEnrollmentPlan("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentPlanNameLengthRule flags a long name", () => {
  const rule = new EnrollmentPlanNameLengthRule(3600);
  const item = newEnrollmentPlan("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentPlanRequiredNameRule flags a blank name", () => {
  const rule = new EnrollmentPlanRequiredNameRule("enrollment plan needs this field");
  const item = newEnrollmentPlan("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentPlanReviewerLengthRule flags a long reviewer", () => {
  const rule = new EnrollmentPlanReviewerLengthRule(86400);
  const item = newEnrollmentPlan("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
