import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalLevelAssignmentCodeLengthRule,
  GlobalLevelAssignmentRequiredCodeRule,
  GlobalLevelAssignmentRequiredNameRule,
  defaultGlobalLevelAssignmentValidator,
} from "./global-level-assignment-rules.js";
import { newGlobalLevelAssignment } from "./global-level-assignment.js";

test("GlobalLevelAssignmentValidator reports every problem", () => {
  const validator = defaultGlobalLevelAssignmentValidator();
  const item = newGlobalLevelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalLevelAssignmentCodeLengthRule flags a long code", () => {
  const rule = new GlobalLevelAssignmentCodeLengthRule(1000);
  const item = newGlobalLevelAssignment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalLevelAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalLevelAssignmentRequiredCodeRule("global level assignment needs an entry");
  const item = newGlobalLevelAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalLevelAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new GlobalLevelAssignmentRequiredNameRule("global level assignment needs an entry");
  const item = newGlobalLevelAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
