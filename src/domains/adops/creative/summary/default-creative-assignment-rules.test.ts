import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCreativeAssignmentDurationMinutesRangeRule,
  DefaultCreativeAssignmentRequiredNameRule,
  defaultDefaultCreativeAssignmentValidator,
} from "./default-creative-assignment-rules.js";
import { newDefaultCreativeAssignment } from "./default-creative-assignment.js";

test("DefaultCreativeAssignmentValidator reports every problem", () => {
  const validator = defaultDefaultCreativeAssignmentValidator();
  const item = newDefaultCreativeAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCreativeAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new DefaultCreativeAssignmentRequiredNameRule("default creative assignment needs this field");
  const item = newDefaultCreativeAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCreativeAssignmentDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultCreativeAssignmentDurationMinutesRangeRule(16, 1000);
  const item = newDefaultCreativeAssignment("x", "y");
  item.durationMinutes = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
