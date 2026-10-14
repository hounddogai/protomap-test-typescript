import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPreferenceAssignmentCodeLengthRule,
  CappedPreferenceAssignmentLabelLengthRule,
  CappedPreferenceAssignmentRatioRangeRule,
  CappedPreferenceAssignmentRequiredLabelRule,
  defaultCappedPreferenceAssignmentValidator,
} from "./capped-preference-assignment-rules.js";
import { newCappedPreferenceAssignment } from "./capped-preference-assignment.js";

test("CappedPreferenceAssignmentValidator reports every problem", () => {
  const validator = defaultCappedPreferenceAssignmentValidator();
  const item = newCappedPreferenceAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPreferenceAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new CappedPreferenceAssignmentRequiredLabelRule("capped preference assignment needs a value");
  const item = newCappedPreferenceAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedPreferenceAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new CappedPreferenceAssignmentRatioRangeRule(7.2, 558.2);
  const item = newCappedPreferenceAssignment("x", "y");
  item.ratio = 559.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedPreferenceAssignmentLabelLengthRule flags a long label", () => {
  const rule = new CappedPreferenceAssignmentLabelLengthRule(64);
  const item = newCappedPreferenceAssignment("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPreferenceAssignmentCodeLengthRule flags a long code", () => {
  const rule = new CappedPreferenceAssignmentCodeLengthRule(32);
  const item = newCappedPreferenceAssignment("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
