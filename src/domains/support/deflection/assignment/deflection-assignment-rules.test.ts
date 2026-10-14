import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionAssignmentCodeLengthRule,
  DeflectionAssignmentCohortLengthRule,
  DeflectionAssignmentFloorValueRangeRule,
  DeflectionAssignmentRequiredCodeRule,
  DeflectionAssignmentRequiredCohortRule,
  DeflectionAssignmentStartsAtRangeRule,
  defaultDeflectionAssignmentValidator,
} from "./deflection-assignment-rules.js";
import { newDeflectionAssignment } from "./deflection-assignment.js";

test("DeflectionAssignmentValidator reports every problem", () => {
  const validator = defaultDeflectionAssignmentValidator();
  const item = newDeflectionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionAssignmentStartsAtRangeRule flags values above starts at", () => {
  const rule = new DeflectionAssignmentStartsAtRangeRule(120, 255);
  const item = newDeflectionAssignment("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionAssignmentCohortLengthRule flags a long cohort", () => {
  const rule = new DeflectionAssignmentCohortLengthRule(120);
  const item = newDeflectionAssignment("x", "y");
  item.cohort = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionAssignmentCodeLengthRule flags a long code", () => {
  const rule = new DeflectionAssignmentCodeLengthRule(3600);
  const item = newDeflectionAssignment("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionAssignmentFloorValueRangeRule flags values above floor value", () => {
  const rule = new DeflectionAssignmentFloorValueRangeRule(0.6, 1432.7);
  const item = newDeflectionAssignment("x", "y");
  item.floorValue = 1434.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionAssignmentRequiredCodeRule("deflection assignment needs this field");
  const item = newDeflectionAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionAssignmentRequiredCohortRule flags a blank cohort", () => {
  const rule = new DeflectionAssignmentRequiredCohortRule("deflection assignment needs a value");
  const item = newDeflectionAssignment("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
