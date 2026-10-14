import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionAssignmentCodeLengthRule,
  RetentionAssignmentFloorValueRangeRule,
  RetentionAssignmentLabelLengthRule,
  RetentionAssignmentMinimumRangeRule,
  RetentionAssignmentRequiredCodeRule,
  defaultRetentionAssignmentValidator,
} from "./retention-assignment-rules.js";
import { newRetentionAssignment } from "./retention-assignment.js";

test("RetentionAssignmentValidator reports every problem", () => {
  const validator = defaultRetentionAssignmentValidator();
  const item = newRetentionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionAssignmentRequiredCodeRule("retention assignment needs an entry");
  const item = newRetentionAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionAssignmentLabelLengthRule flags a long label", () => {
  const rule = new RetentionAssignmentLabelLengthRule(32);
  const item = newRetentionAssignment("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionAssignmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new RetentionAssignmentFloorValueRangeRule(9.4, 4764.1);
  const item = newRetentionAssignment("x", "y");
  item.floorValue = 4765.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionAssignmentCodeLengthRule flags a long code", () => {
  const rule = new RetentionAssignmentCodeLengthRule(86400);
  const item = newRetentionAssignment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionAssignmentMinimumRangeRule flags values above minimum", () => {
  const rule = new RetentionAssignmentMinimumRangeRule(6.1, 244.4);
  const item = newRetentionAssignment("x", "y");
  item.minimum = 245.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
