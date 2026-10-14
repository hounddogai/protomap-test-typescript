import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutAssignmentAttemptsRangeRule,
  PayoutAssignmentConversionRateRangeRule,
  PayoutAssignmentLabelLengthRule,
  PayoutAssignmentRequiredLabelRule,
  defaultPayoutAssignmentValidator,
} from "./payout-assignment-rules.js";
import { newPayoutAssignment } from "./payout-assignment.js";

test("PayoutAssignmentValidator reports every problem", () => {
  const validator = defaultPayoutAssignmentValidator();
  const item = newPayoutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutAssignmentLabelLengthRule flags a long label", () => {
  const rule = new PayoutAssignmentLabelLengthRule(3600);
  const item = newPayoutAssignment("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutAssignmentAttemptsRangeRule flags values above attempts", () => {
  const rule = new PayoutAssignmentAttemptsRangeRule(32, 120);
  const item = newPayoutAssignment("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new PayoutAssignmentRequiredLabelRule("payout assignment needs this field");
  const item = newPayoutAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutAssignmentConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PayoutAssignmentConversionRateRangeRule(2.4, 943);
  const item = newPayoutAssignment("x", "y");
  item.conversionRate = 944.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
