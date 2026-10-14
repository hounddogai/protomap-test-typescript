import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingBadgeAssignmentBidRangeRule,
  RollingBadgeAssignmentCodeLengthRule,
  RollingBadgeAssignmentGraceDaysRangeRule,
  RollingBadgeAssignmentLabelLengthRule,
  defaultRollingBadgeAssignmentValidator,
} from "./rolling-badge-assignment-rules.js";
import { newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

test("RollingBadgeAssignmentValidator reports every problem", () => {
  const validator = defaultRollingBadgeAssignmentValidator();
  const item = newRollingBadgeAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingBadgeAssignmentBidRangeRule flags values above bid", () => {
  const rule = new RollingBadgeAssignmentBidRangeRule(1.4, 4254.3);
  const item = newRollingBadgeAssignment("x", "y");
  item.bid = 4255.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBadgeAssignmentGraceDaysRangeRule flags values above grace days", () => {
  const rule = new RollingBadgeAssignmentGraceDaysRangeRule(16, 3600);
  const item = newRollingBadgeAssignment("x", "y");
  item.graceDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingBadgeAssignmentLabelLengthRule flags a long label", () => {
  const rule = new RollingBadgeAssignmentLabelLengthRule(32);
  const item = newRollingBadgeAssignment("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingBadgeAssignmentCodeLengthRule flags a long code", () => {
  const rule = new RollingBadgeAssignmentCodeLengthRule(1000);
  const item = newRollingBadgeAssignment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
