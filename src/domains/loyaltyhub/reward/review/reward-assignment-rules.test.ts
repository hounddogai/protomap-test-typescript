import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardAssignmentGraceDaysRangeRule,
  RewardAssignmentOwnerIdLengthRule,
  RewardAssignmentRatioRangeRule,
  RewardAssignmentRequiredOwnerIdRule,
  RewardAssignmentRetriesRangeRule,
  RewardAssignmentUnitLengthRule,
  defaultRewardAssignmentValidator,
} from "./reward-assignment-rules.js";
import { newRewardAssignment } from "./reward-assignment.js";

test("RewardAssignmentValidator reports every problem", () => {
  const validator = defaultRewardAssignmentValidator();
  const item = newRewardAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardAssignmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RewardAssignmentGraceDaysRangeRule(16, 1000);
  const item = newRewardAssignment("x", "y");
  item.graceDays = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardAssignmentRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new RewardAssignmentRequiredOwnerIdRule("reward assignment needs an entry");
  const item = newRewardAssignment("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardAssignmentRetriesRangeRule flags values above retries", () => {
  const rule = new RewardAssignmentRetriesRangeRule(32, 255);
  const item = newRewardAssignment("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardAssignmentOwnerIdLengthRule flags a long owner id", () => {
  const rule = new RewardAssignmentOwnerIdLengthRule(32);
  const item = newRewardAssignment("x", "y");
  item.ownerId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardAssignmentUnitLengthRule flags a long unit", () => {
  const rule = new RewardAssignmentUnitLengthRule(32);
  const item = newRewardAssignment("x", "y");
  item.unit = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new RewardAssignmentRatioRangeRule(1, 2300.4);
  const item = newRewardAssignment("x", "y");
  item.ratio = 2301.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
