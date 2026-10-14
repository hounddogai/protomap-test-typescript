import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRedemptionAssignmentCodeLengthRule,
  ManualRedemptionAssignmentRequiredLabelRule,
  ManualRedemptionAssignmentVersionRangeRule,
  ManualRedemptionAssignmentWindowDaysRangeRule,
  defaultManualRedemptionAssignmentValidator,
} from "./manual-redemption-assignment-rules.js";
import { newManualRedemptionAssignment } from "./manual-redemption-assignment.js";

test("ManualRedemptionAssignmentValidator reports every problem", () => {
  const validator = defaultManualRedemptionAssignmentValidator();
  const item = newManualRedemptionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRedemptionAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new ManualRedemptionAssignmentRequiredLabelRule("manual redemption assignment needs a value");
  const item = newManualRedemptionAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualRedemptionAssignmentVersionRangeRule flags values above version", () => {
  const rule = new ManualRedemptionAssignmentVersionRangeRule(64, 1000);
  const item = newManualRedemptionAssignment("x", "y");
  item.version = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRedemptionAssignmentCodeLengthRule flags a long code", () => {
  const rule = new ManualRedemptionAssignmentCodeLengthRule(86400);
  const item = newManualRedemptionAssignment("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRedemptionAssignmentWindowDaysRangeRule flags values above window days", () => {
  const rule = new ManualRedemptionAssignmentWindowDaysRangeRule(120, 120);
  const item = newManualRedemptionAssignment("x", "y");
  item.windowDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
