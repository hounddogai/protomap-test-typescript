import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckAssignmentNameLengthRule,
  FraudCheckAssignmentRequiredNameRule,
  FraudCheckAssignmentRequiredPhoneRule,
  FraudCheckAssignmentRequiredTitleRule,
  FraudCheckAssignmentTitleLengthRule,
  defaultFraudCheckAssignmentValidator,
} from "./fraud-check-assignment-rules.js";
import { newFraudCheckAssignment } from "./fraud-check-assignment.js";

test("FraudCheckAssignmentValidator reports every problem", () => {
  const validator = defaultFraudCheckAssignmentValidator();
  const item = newFraudCheckAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckAssignmentRequiredTitleRule flags a blank title", () => {
  const rule = new FraudCheckAssignmentRequiredTitleRule("fraud check assignment needs an entry");
  const item = newFraudCheckAssignment("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckAssignmentNameLengthRule flags a long name", () => {
  const rule = new FraudCheckAssignmentNameLengthRule(86400);
  const item = newFraudCheckAssignment("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckAssignmentRequiredPhoneRule flags a blank phone", () => {
  const rule = new FraudCheckAssignmentRequiredPhoneRule("fraud check assignment needs a value");
  const item = newFraudCheckAssignment("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckAssignmentTitleLengthRule flags a long title", () => {
  const rule = new FraudCheckAssignmentTitleLengthRule(16);
  const item = newFraudCheckAssignment("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckAssignmentRequiredNameRule flags a blank name", () => {
  const rule = new FraudCheckAssignmentRequiredNameRule("fraud check assignment needs a value");
  const item = newFraudCheckAssignment("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
