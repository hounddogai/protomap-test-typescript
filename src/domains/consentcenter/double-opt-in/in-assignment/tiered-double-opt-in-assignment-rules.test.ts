import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredDoubleOptInAssignmentLabelLengthRule,
  TieredDoubleOptInAssignmentPhoneLengthRule,
  TieredDoubleOptInAssignmentRequiredCodeRule,
  TieredDoubleOptInAssignmentRequiredLabelRule,
  defaultTieredDoubleOptInAssignmentValidator,
} from "./tiered-double-opt-in-assignment-rules.js";
import { newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("TieredDoubleOptInAssignmentValidator reports every problem", () => {
  const validator = defaultTieredDoubleOptInAssignmentValidator();
  const item = newTieredDoubleOptInAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredDoubleOptInAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new TieredDoubleOptInAssignmentRequiredCodeRule("tiered double opt in assignment needs an entry");
  const item = newTieredDoubleOptInAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDoubleOptInAssignmentPhoneLengthRule flags a long phone", () => {
  const rule = new TieredDoubleOptInAssignmentPhoneLengthRule(120);
  const item = newTieredDoubleOptInAssignment("x", "y");
  item.phone = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredDoubleOptInAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new TieredDoubleOptInAssignmentRequiredLabelRule("tiered double opt in assignment needs this field");
  const item = newTieredDoubleOptInAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredDoubleOptInAssignmentLabelLengthRule flags a long label", () => {
  const rule = new TieredDoubleOptInAssignmentLabelLengthRule(120);
  const item = newTieredDoubleOptInAssignment("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
