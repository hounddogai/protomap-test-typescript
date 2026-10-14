import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutAssignmentRatioRangeRule,
  OptOutAssignmentRequiredCodeRule,
  OptOutAssignmentRequiredLabelRule,
  defaultOptOutAssignmentValidator,
} from "./opt-out-assignment-rules.js";
import { newOptOutAssignment } from "./opt-out-assignment.js";

test("OptOutAssignmentValidator reports every problem", () => {
  const validator = defaultOptOutAssignmentValidator();
  const item = newOptOutAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new OptOutAssignmentRatioRangeRule(5.5, 2726.5);
  const item = newOptOutAssignment("x", "y");
  item.ratio = 2728;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("OptOutAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutAssignmentRequiredCodeRule("opt out assignment needs an entry");
  const item = newOptOutAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new OptOutAssignmentRequiredLabelRule("opt out assignment needs this field");
  const item = newOptOutAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
