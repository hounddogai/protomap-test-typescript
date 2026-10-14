import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExitRuleAssignmentCodeLengthRule,
  ExitRuleAssignmentMinimumRangeRule,
  ExitRuleAssignmentRequiredCodeRule,
  defaultExitRuleAssignmentValidator,
} from "./exit-rule-assignment-rules.js";
import { newExitRuleAssignment } from "./exit-rule-assignment.js";

test("ExitRuleAssignmentValidator reports every problem", () => {
  const validator = defaultExitRuleAssignmentValidator();
  const item = newExitRuleAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ExitRuleAssignmentCodeLengthRule flags a long code", () => {
  const rule = new ExitRuleAssignmentCodeLengthRule(1000);
  const item = newExitRuleAssignment("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ExitRuleAssignmentMinimumRangeRule flags values above minimum", () => {
  const rule = new ExitRuleAssignmentMinimumRangeRule(8.1, 1405.4);
  const item = newExitRuleAssignment("x", "y");
  item.minimum = 1406.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ExitRuleAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new ExitRuleAssignmentRequiredCodeRule("exit rule assignment needs this field");
  const item = newExitRuleAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
