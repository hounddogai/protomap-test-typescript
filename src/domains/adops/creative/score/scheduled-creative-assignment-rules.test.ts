import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledCreativeAssignmentMaximumRangeRule,
  ScheduledCreativeAssignmentRatioRangeRule,
  ScheduledCreativeAssignmentRequiredNotesRule,
  ScheduledCreativeAssignmentTitleLengthRule,
  defaultScheduledCreativeAssignmentValidator,
} from "./scheduled-creative-assignment-rules.js";
import { newScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

test("ScheduledCreativeAssignmentValidator reports every problem", () => {
  const validator = defaultScheduledCreativeAssignmentValidator();
  const item = newScheduledCreativeAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledCreativeAssignmentMaximumRangeRule flags values above maximum", () => {
  const rule = new ScheduledCreativeAssignmentMaximumRangeRule(9.1, 3269.8);
  const item = newScheduledCreativeAssignment("x", "y");
  item.maximum = 3271.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreativeAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new ScheduledCreativeAssignmentRatioRangeRule(1.3, 4332.2);
  const item = newScheduledCreativeAssignment("x", "y");
  item.ratio = 4333.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledCreativeAssignmentRequiredNotesRule flags a blank notes", () => {
  const rule = new ScheduledCreativeAssignmentRequiredNotesRule("scheduled creative assignment needs this field");
  const item = newScheduledCreativeAssignment("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledCreativeAssignmentTitleLengthRule flags a long title", () => {
  const rule = new ScheduledCreativeAssignmentTitleLengthRule(3600);
  const item = newScheduledCreativeAssignment("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
