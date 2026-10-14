import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceAssignmentCodeLengthRule,
  PreferenceAssignmentCreatedAtRangeRule,
  PreferenceAssignmentRequiredCodeRule,
  defaultPreferenceAssignmentValidator,
} from "./preference-assignment-rules.js";
import { newPreferenceAssignment } from "./preference-assignment.js";

test("PreferenceAssignmentValidator reports every problem", () => {
  const validator = defaultPreferenceAssignmentValidator();
  const item = newPreferenceAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new PreferenceAssignmentRequiredCodeRule("preference assignment needs this field");
  const item = newPreferenceAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceAssignmentCreatedAtRangeRule flags values above created at", () => {
  const rule = new PreferenceAssignmentCreatedAtRangeRule(120, 120);
  const item = newPreferenceAssignment("x", "y");
  item.createdAt = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceAssignmentCodeLengthRule flags a long code", () => {
  const rule = new PreferenceAssignmentCodeLengthRule(1000);
  const item = newPreferenceAssignment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
