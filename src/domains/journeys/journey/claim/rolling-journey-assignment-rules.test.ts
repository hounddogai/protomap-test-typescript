import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingJourneyAssignmentMaximumRangeRule,
  RollingJourneyAssignmentRequiredDescriptionRule,
  RollingJourneyAssignmentTitleLengthRule,
  defaultRollingJourneyAssignmentValidator,
} from "./rolling-journey-assignment-rules.js";
import { newRollingJourneyAssignment } from "./rolling-journey-assignment.js";

test("RollingJourneyAssignmentValidator reports every problem", () => {
  const validator = defaultRollingJourneyAssignmentValidator();
  const item = newRollingJourneyAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingJourneyAssignmentTitleLengthRule flags a long title", () => {
  const rule = new RollingJourneyAssignmentTitleLengthRule(255);
  const item = newRollingJourneyAssignment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingJourneyAssignmentMaximumRangeRule flags values above maximum", () => {
  const rule = new RollingJourneyAssignmentMaximumRangeRule(9.7, 3570.5);
  const item = newRollingJourneyAssignment("x", "y");
  item.maximum = 3572;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingJourneyAssignmentRequiredDescriptionRule flags a blank description", () => {
  const rule = new RollingJourneyAssignmentRequiredDescriptionRule("rolling journey assignment needs an entry");
  const item = newRollingJourneyAssignment("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
