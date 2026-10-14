import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledPreferenceAssignmentCodeLengthRule,
  ScheduledPreferenceAssignmentFrequencyCapRangeRule,
  ScheduledPreferenceAssignmentRequiredCategoryRule,
  ScheduledPreferenceAssignmentRequiredTitleRule,
  ScheduledPreferenceAssignmentSendAtRangeRule,
  ScheduledPreferenceAssignmentTitleLengthRule,
  defaultScheduledPreferenceAssignmentValidator,
} from "./scheduled-preference-assignment-rules.js";
import { newScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

test("ScheduledPreferenceAssignmentValidator reports every problem", () => {
  const validator = defaultScheduledPreferenceAssignmentValidator();
  const item = newScheduledPreferenceAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledPreferenceAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new ScheduledPreferenceAssignmentRequiredTitleRule("scheduled preference assignment needs a value");
  const item = newScheduledPreferenceAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPreferenceAssignmentCodeLengthRule flags a long code", () => {
  const rule = new ScheduledPreferenceAssignmentCodeLengthRule(255);
  const item = newScheduledPreferenceAssignment("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPreferenceAssignmentTitleLengthRule flags a long title", () => {
  const rule = new ScheduledPreferenceAssignmentTitleLengthRule(255);
  const item = newScheduledPreferenceAssignment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledPreferenceAssignmentSendAtRangeRule flags values above send at", () => {
  const rule = new ScheduledPreferenceAssignmentSendAtRangeRule(255, 255);
  const item = newScheduledPreferenceAssignment("x", "y");
  item.sendAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledPreferenceAssignmentRequiredCategoryRule flags a blank category", () => {
  const rule = new ScheduledPreferenceAssignmentRequiredCategoryRule("scheduled preference assignment needs a value");
  const item = newScheduledPreferenceAssignment("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledPreferenceAssignmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ScheduledPreferenceAssignmentFrequencyCapRangeRule(16, 64);
  const item = newScheduledPreferenceAssignment("x", "y");
  item.frequencyCap = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
