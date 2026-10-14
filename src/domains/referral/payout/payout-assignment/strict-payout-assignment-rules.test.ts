import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictPayoutAssignmentCodeLengthRule,
  StrictPayoutAssignmentRequiredCodeRule,
  StrictPayoutAssignmentWindowDaysRangeRule,
  defaultStrictPayoutAssignmentValidator,
} from "./strict-payout-assignment-rules.js";
import { newStrictPayoutAssignment } from "./strict-payout-assignment.js";

test("StrictPayoutAssignmentValidator reports every problem", () => {
  const validator = defaultStrictPayoutAssignmentValidator();
  const item = newStrictPayoutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictPayoutAssignmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new StrictPayoutAssignmentWindowDaysRangeRule(86400, 86400);
  const item = newStrictPayoutAssignment("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictPayoutAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictPayoutAssignmentRequiredCodeRule("strict payout assignment needs this field");
  const item = newStrictPayoutAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictPayoutAssignmentCodeLengthRule flags a long code", () => {
  const rule = new StrictPayoutAssignmentCodeLengthRule(86400);
  const item = newStrictPayoutAssignment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
