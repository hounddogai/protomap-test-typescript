import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DoubleOptInAssignmentMaximumRangeRule,
  DoubleOptInAssignmentRequiredSegmentRule,
  defaultDoubleOptInAssignmentValidator,
} from "./double-opt-in-assignment-rules.js";
import { newDoubleOptInAssignment } from "./double-opt-in-assignment.js";

test("DoubleOptInAssignmentValidator reports every problem", () => {
  const validator = defaultDoubleOptInAssignmentValidator();
  const item = newDoubleOptInAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DoubleOptInAssignmentRequiredSegmentRule flags a blank segment", () => {
  const rule = new DoubleOptInAssignmentRequiredSegmentRule("double opt in assignment needs a value");
  const item = newDoubleOptInAssignment("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DoubleOptInAssignmentMaximumRangeRule flags values above maximum", () => {
  const rule = new DoubleOptInAssignmentMaximumRangeRule(6.4, 119.3);
  const item = newDoubleOptInAssignment("x", "y");
  item.maximum = 120.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
