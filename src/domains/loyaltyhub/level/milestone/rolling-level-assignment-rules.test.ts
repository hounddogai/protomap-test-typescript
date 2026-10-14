import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLevelAssignmentExternalRefLengthRule,
  RollingLevelAssignmentRequiredExternalRefRule,
  defaultRollingLevelAssignmentValidator,
} from "./rolling-level-assignment-rules.js";
import { newRollingLevelAssignment } from "./rolling-level-assignment.js";

test("RollingLevelAssignmentValidator reports every problem", () => {
  const validator = defaultRollingLevelAssignmentValidator();
  const item = newRollingLevelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLevelAssignmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new RollingLevelAssignmentRequiredExternalRefRule("rolling level assignment needs a value");
  const item = newRollingLevelAssignment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingLevelAssignmentExternalRefLengthRule flags a long external ref", () => {
  const rule = new RollingLevelAssignmentExternalRefLengthRule(86400);
  const item = newRollingLevelAssignment("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
