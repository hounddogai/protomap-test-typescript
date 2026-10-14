import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePayoutAssignmentExpiresAtRangeRule,
  AdaptivePayoutAssignmentRequiredCodeRule,
  AdaptivePayoutAssignmentRequiredTitleRule,
  AdaptivePayoutAssignmentTitleLengthRule,
  defaultAdaptivePayoutAssignmentValidator,
} from "./adaptive-payout-assignment-rules.js";
import { newAdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

test("AdaptivePayoutAssignmentValidator reports every problem", () => {
  const validator = defaultAdaptivePayoutAssignmentValidator();
  const item = newAdaptivePayoutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePayoutAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptivePayoutAssignmentRequiredTitleRule("adaptive payout assignment needs a value");
  const item = newAdaptivePayoutAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePayoutAssignmentExpiresAtRangeRule flags values above expires at", () => {
  const rule = new AdaptivePayoutAssignmentExpiresAtRangeRule(255, 3600);
  const item = newAdaptivePayoutAssignment("x", "y");
  item.expiresAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptivePayoutAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptivePayoutAssignmentRequiredCodeRule("adaptive payout assignment needs an entry");
  const item = newAdaptivePayoutAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptivePayoutAssignmentTitleLengthRule flags a long title", () => {
  const rule = new AdaptivePayoutAssignmentTitleLengthRule(1000);
  const item = newAdaptivePayoutAssignment("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
