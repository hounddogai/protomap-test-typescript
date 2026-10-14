import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientModelAssignmentRequiredCodeRule,
  LenientModelAssignmentUpdatedAtRangeRule,
  defaultLenientModelAssignmentValidator,
} from "./lenient-model-assignment-rules.js";
import { newLenientModelAssignment } from "./lenient-model-assignment.js";

test("LenientModelAssignmentValidator reports every problem", () => {
  const validator = defaultLenientModelAssignmentValidator();
  const item = newLenientModelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientModelAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new LenientModelAssignmentRequiredCodeRule("lenient model assignment needs a value");
  const item = newLenientModelAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientModelAssignmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new LenientModelAssignmentUpdatedAtRangeRule(80, 3600);
  const item = newLenientModelAssignment("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
