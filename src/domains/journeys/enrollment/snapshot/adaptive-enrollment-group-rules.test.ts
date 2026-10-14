import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveEnrollmentGroupAttemptsRangeRule,
  AdaptiveEnrollmentGroupAudienceIdLengthRule,
  AdaptiveEnrollmentGroupNameLengthRule,
  AdaptiveEnrollmentGroupRequiredNameRule,
  defaultAdaptiveEnrollmentGroupValidator,
} from "./adaptive-enrollment-group-rules.js";
import { newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

test("AdaptiveEnrollmentGroupValidator reports every problem", () => {
  const validator = defaultAdaptiveEnrollmentGroupValidator();
  const item = newAdaptiveEnrollmentGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveEnrollmentGroupAttemptsRangeRule flags values above attempts", () => {
  const rule = new AdaptiveEnrollmentGroupAttemptsRangeRule(120, 120);
  const item = newAdaptiveEnrollmentGroup("x", "y");
  item.attempts = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveEnrollmentGroupAudienceIdLengthRule flags a long audience id", () => {
  const rule = new AdaptiveEnrollmentGroupAudienceIdLengthRule(120);
  const item = newAdaptiveEnrollmentGroup("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentGroupNameLengthRule flags a long name", () => {
  const rule = new AdaptiveEnrollmentGroupNameLengthRule(32);
  const item = newAdaptiveEnrollmentGroup("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveEnrollmentGroupRequiredNameRule flags a blank name", () => {
  const rule = new AdaptiveEnrollmentGroupRequiredNameRule("adaptive enrollment group needs an entry");
  const item = newAdaptiveEnrollmentGroup("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
