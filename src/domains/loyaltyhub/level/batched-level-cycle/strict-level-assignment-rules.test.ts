import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictLevelAssignmentCapacityRangeRule,
  StrictLevelAssignmentCodeLengthRule,
  StrictLevelAssignmentRequiredCodeRule,
  StrictLevelAssignmentRequiredContactEmailRule,
  defaultStrictLevelAssignmentValidator,
} from "./strict-level-assignment-rules.js";
import { newStrictLevelAssignment } from "./strict-level-assignment.js";

test("StrictLevelAssignmentValidator reports every problem", () => {
  const validator = defaultStrictLevelAssignmentValidator();
  const item = newStrictLevelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictLevelAssignmentCodeLengthRule flags a long code", () => {
  const rule = new StrictLevelAssignmentCodeLengthRule(80);
  const item = newStrictLevelAssignment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictLevelAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictLevelAssignmentRequiredCodeRule("strict level assignment needs this field");
  const item = newStrictLevelAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLevelAssignmentCapacityRangeRule flags values above capacity", () => {
  const rule = new StrictLevelAssignmentCapacityRangeRule(64, 255);
  const item = newStrictLevelAssignment("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictLevelAssignmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new StrictLevelAssignmentRequiredContactEmailRule("strict level assignment needs an entry");
  const item = newStrictLevelAssignment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
