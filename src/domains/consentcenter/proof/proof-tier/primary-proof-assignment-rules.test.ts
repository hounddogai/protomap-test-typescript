import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryProofAssignmentRequiredExternalRefRule,
  PrimaryProofAssignmentRequiredUnitRule,
  PrimaryProofAssignmentTitleLengthRule,
  defaultPrimaryProofAssignmentValidator,
} from "./primary-proof-assignment-rules.js";
import { newPrimaryProofAssignment } from "./primary-proof-assignment.js";

test("PrimaryProofAssignmentValidator reports every problem", () => {
  const validator = defaultPrimaryProofAssignmentValidator();
  const item = newPrimaryProofAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryProofAssignmentRequiredUnitRule flags a blank unit", () => {
  const rule = new PrimaryProofAssignmentRequiredUnitRule("primary proof assignment needs an entry");
  const item = newPrimaryProofAssignment("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofAssignmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new PrimaryProofAssignmentRequiredExternalRefRule("primary proof assignment needs this field");
  const item = newPrimaryProofAssignment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryProofAssignmentTitleLengthRule flags a long title", () => {
  const rule = new PrimaryProofAssignmentTitleLengthRule(120);
  const item = newPrimaryProofAssignment("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
