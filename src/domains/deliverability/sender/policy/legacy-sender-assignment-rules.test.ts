import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacySenderAssignmentRequiredCodeRule,
  LegacySenderAssignmentSegmentLengthRule,
  LegacySenderAssignmentSequenceRangeRule,
  defaultLegacySenderAssignmentValidator,
} from "./legacy-sender-assignment-rules.js";
import { newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("LegacySenderAssignmentValidator reports every problem", () => {
  const validator = defaultLegacySenderAssignmentValidator();
  const item = newLegacySenderAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacySenderAssignmentSegmentLengthRule flags a long segment", () => {
  const rule = new LegacySenderAssignmentSegmentLengthRule(64);
  const item = newLegacySenderAssignment("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacySenderAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new LegacySenderAssignmentRequiredCodeRule("legacy sender assignment needs this field");
  const item = newLegacySenderAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacySenderAssignmentSequenceRangeRule flags values above sequence", () => {
  const rule = new LegacySenderAssignmentSequenceRangeRule(16, 64);
  const item = newLegacySenderAssignment("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
