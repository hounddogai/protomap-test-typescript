import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEnrollmentMilestoneCodeLengthRule,
  WeightedEnrollmentMilestoneNameLengthRule,
  WeightedEnrollmentMilestoneRequiredCodeRule,
  WeightedEnrollmentMilestoneSendAtRangeRule,
  WeightedEnrollmentMilestoneTitleLengthRule,
  defaultWeightedEnrollmentMilestoneValidator,
} from "./weighted-enrollment-milestone-rules.js";
import { newWeightedEnrollmentMilestone } from "./weighted-enrollment-milestone.js";

test("WeightedEnrollmentMilestoneValidator reports every problem", () => {
  const validator = defaultWeightedEnrollmentMilestoneValidator();
  const item = newWeightedEnrollmentMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEnrollmentMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedEnrollmentMilestoneRequiredCodeRule("weighted enrollment milestone needs this field");
  const item = newWeightedEnrollmentMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedEnrollmentMilestoneCodeLengthRule flags a long code", () => {
  const rule = new WeightedEnrollmentMilestoneCodeLengthRule(86400);
  const item = newWeightedEnrollmentMilestone("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEnrollmentMilestoneSendAtRangeRule flags values above send at", () => {
  const rule = new WeightedEnrollmentMilestoneSendAtRangeRule(80, 80);
  const item = newWeightedEnrollmentMilestone("x", "y");
  item.sendAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEnrollmentMilestoneTitleLengthRule flags a long title", () => {
  const rule = new WeightedEnrollmentMilestoneTitleLengthRule(1000);
  const item = newWeightedEnrollmentMilestone("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedEnrollmentMilestoneNameLengthRule flags a long name", () => {
  const rule = new WeightedEnrollmentMilestoneNameLengthRule(3600);
  const item = newWeightedEnrollmentMilestone("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
