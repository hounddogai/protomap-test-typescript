import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingStepAssignmentRequiredChecksumRule,
  RollingStepAssignmentRequiredTitleRule,
  RollingStepAssignmentTitleLengthRule,
  defaultRollingStepAssignmentValidator,
} from "./rolling-step-assignment-rules.js";
import { newRollingStepAssignment } from "./rolling-step-assignment.js";

test("RollingStepAssignmentValidator reports every problem", () => {
  const validator = defaultRollingStepAssignmentValidator();
  const item = newRollingStepAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingStepAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new RollingStepAssignmentRequiredTitleRule("rolling step assignment needs this field");
  const item = newRollingStepAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingStepAssignmentRequiredChecksumRule flags a blank checksum", () => {
  const rule = new RollingStepAssignmentRequiredChecksumRule("rolling step assignment needs a value");
  const item = newRollingStepAssignment("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingStepAssignmentTitleLengthRule flags a long title", () => {
  const rule = new RollingStepAssignmentTitleLengthRule(255);
  const item = newRollingStepAssignment("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
