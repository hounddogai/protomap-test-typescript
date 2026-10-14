import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingCohortMilestoneCodeLengthRule,
  RollingCohortMilestoneLimitRangeRule,
  RollingCohortMilestoneRequiredLocaleRule,
  RollingCohortMilestoneRequiredReviewerRule,
  RollingCohortMilestoneTitleLengthRule,
  defaultRollingCohortMilestoneValidator,
} from "./rolling-cohort-milestone-rules.js";
import { newRollingCohortMilestone } from "./rolling-cohort-milestone.js";

test("RollingCohortMilestoneValidator reports every problem", () => {
  const validator = defaultRollingCohortMilestoneValidator();
  const item = newRollingCohortMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingCohortMilestoneTitleLengthRule flags a long title", () => {
  const rule = new RollingCohortMilestoneTitleLengthRule(255);
  const item = newRollingCohortMilestone("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCohortMilestoneRequiredLocaleRule flags a blank locale", () => {
  const rule = new RollingCohortMilestoneRequiredLocaleRule("rolling cohort milestone needs a value");
  const item = newRollingCohortMilestone("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortMilestoneCodeLengthRule flags a long code", () => {
  const rule = new RollingCohortMilestoneCodeLengthRule(64);
  const item = newRollingCohortMilestone("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingCohortMilestoneRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RollingCohortMilestoneRequiredReviewerRule("rolling cohort milestone needs a value");
  const item = newRollingCohortMilestone("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingCohortMilestoneLimitRangeRule flags values above limit", () => {
  const rule = new RollingCohortMilestoneLimitRangeRule(80, 255);
  const item = newRollingCohortMilestone("x", "y");
  item.limit = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
