import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedDeflectionAssignmentBudgetRangeRule,
  WeightedDeflectionAssignmentCeilingRangeRule,
  WeightedDeflectionAssignmentCodeLengthRule,
  WeightedDeflectionAssignmentLabelLengthRule,
  defaultWeightedDeflectionAssignmentValidator,
} from "./weighted-deflection-assignment-rules.js";
import { newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("WeightedDeflectionAssignmentValidator reports every problem", () => {
  const validator = defaultWeightedDeflectionAssignmentValidator();
  const item = newWeightedDeflectionAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedDeflectionAssignmentLabelLengthRule flags a long label", () => {
  const rule = new WeightedDeflectionAssignmentLabelLengthRule(32);
  const item = newWeightedDeflectionAssignment("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDeflectionAssignmentCeilingRangeRule flags values above ceiling", () => {
  const rule = new WeightedDeflectionAssignmentCeilingRangeRule(9.2, 490);
  const item = newWeightedDeflectionAssignment("x", "y");
  item.ceiling = 491.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedDeflectionAssignmentCodeLengthRule flags a long code", () => {
  const rule = new WeightedDeflectionAssignmentCodeLengthRule(80);
  const item = newWeightedDeflectionAssignment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedDeflectionAssignmentBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedDeflectionAssignmentBudgetRangeRule(2.4, 642);
  const item = newWeightedDeflectionAssignment("x", "y");
  item.budget = 643.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
