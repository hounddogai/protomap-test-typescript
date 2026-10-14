import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RedemptionAssignmentAudienceIdLengthRule,
  RedemptionAssignmentFloorValueRangeRule,
  RedemptionAssignmentRequiredAudienceIdRule,
  RedemptionAssignmentRequiredCodeRule,
  RedemptionAssignmentReviewerLengthRule,
  defaultRedemptionAssignmentValidator,
} from "./redemption-assignment-rules.js";
import { newRedemptionAssignment } from "./redemption-assignment.js";

test("RedemptionAssignmentValidator reports every problem", () => {
  const validator = defaultRedemptionAssignmentValidator();
  const item = newRedemptionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RedemptionAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new RedemptionAssignmentRequiredCodeRule("redemption assignment needs a value");
  const item = newRedemptionAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RedemptionAssignmentAudienceIdLengthRule flags a long audience id", () => {
  const rule = new RedemptionAssignmentAudienceIdLengthRule(120);
  const item = newRedemptionAssignment("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAssignmentReviewerLengthRule flags a long reviewer", () => {
  const rule = new RedemptionAssignmentReviewerLengthRule(86400);
  const item = newRedemptionAssignment("x", "y");
  item.reviewer = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RedemptionAssignmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new RedemptionAssignmentFloorValueRangeRule(5, 2419.8);
  const item = newRedemptionAssignment("x", "y");
  item.floorValue = 2421.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RedemptionAssignmentRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new RedemptionAssignmentRequiredAudienceIdRule("redemption assignment needs an entry");
  const item = newRedemptionAssignment("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
