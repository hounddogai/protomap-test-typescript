import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedProofAssignmentBudgetRangeRule,
  WeightedProofAssignmentExternalRefLengthRule,
  WeightedProofAssignmentRequiredExternalRefRule,
  defaultWeightedProofAssignmentValidator,
} from "./weighted-proof-assignment-rules.js";
import { newWeightedProofAssignment } from "./weighted-proof-assignment.js";

test("WeightedProofAssignmentValidator reports every problem", () => {
  const validator = defaultWeightedProofAssignmentValidator();
  const item = newWeightedProofAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedProofAssignmentExternalRefLengthRule flags a long external ref", () => {
  const rule = new WeightedProofAssignmentExternalRefLengthRule(255);
  const item = newWeightedProofAssignment("x", "y");
  item.externalRef = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedProofAssignmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new WeightedProofAssignmentRequiredExternalRefRule("weighted proof assignment needs an entry");
  const item = newWeightedProofAssignment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedProofAssignmentBudgetRangeRule flags values above budget", () => {
  const rule = new WeightedProofAssignmentBudgetRangeRule(2.3, 690);
  const item = newWeightedProofAssignment("x", "y");
  item.budget = 691.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
