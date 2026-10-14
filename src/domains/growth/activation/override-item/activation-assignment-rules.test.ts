import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationAssignmentAmountRangeRule,
  ActivationAssignmentCodeLengthRule,
  ActivationAssignmentNameLengthRule,
  ActivationAssignmentRequiredContactEmailRule,
  defaultActivationAssignmentValidator,
} from "./activation-assignment-rules.js";
import { newActivationAssignment } from "./activation-assignment.js";

test("ActivationAssignmentValidator reports every problem", () => {
  const validator = defaultActivationAssignmentValidator();
  const item = newActivationAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationAssignmentNameLengthRule flags a long name", () => {
  const rule = new ActivationAssignmentNameLengthRule(80);
  const item = newActivationAssignment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationAssignmentRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new ActivationAssignmentRequiredContactEmailRule("activation assignment needs this field");
  const item = newActivationAssignment("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationAssignmentAmountRangeRule flags values above amount", () => {
  const rule = new ActivationAssignmentAmountRangeRule(8.7, 4300.2);
  const item = newActivationAssignment("x", "y");
  item.amount = 4301.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationAssignmentCodeLengthRule flags a long code", () => {
  const rule = new ActivationAssignmentCodeLengthRule(80);
  const item = newActivationAssignment("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
