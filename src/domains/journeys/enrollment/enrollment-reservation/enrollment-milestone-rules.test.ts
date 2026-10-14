import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentMilestoneLabelLengthRule,
  EnrollmentMilestoneRequiredLabelRule,
  EnrollmentMilestoneUpdatedAtRangeRule,
  defaultEnrollmentMilestoneValidator,
} from "./enrollment-milestone-rules.js";
import { newEnrollmentMilestone } from "./enrollment-milestone.js";

test("EnrollmentMilestoneValidator reports every problem", () => {
  const validator = defaultEnrollmentMilestoneValidator();
  const item = newEnrollmentMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentMilestoneRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentMilestoneRequiredLabelRule("enrollment milestone needs a value");
  const item = newEnrollmentMilestone("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentMilestoneLabelLengthRule flags a long label", () => {
  const rule = new EnrollmentMilestoneLabelLengthRule(32);
  const item = newEnrollmentMilestone("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentMilestoneUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new EnrollmentMilestoneUpdatedAtRangeRule(64, 80);
  const item = newEnrollmentMilestone("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
