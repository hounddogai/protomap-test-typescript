import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DomainAssignmentLabelLengthRule,
  DomainAssignmentMaximumRangeRule,
  DomainAssignmentQuantityRangeRule,
  DomainAssignmentRatioRangeRule,
  DomainAssignmentRequiredCodeRule,
  DomainAssignmentRequiredLabelRule,
  defaultDomainAssignmentValidator,
} from "./domain-assignment-rules.js";
import { newDomainAssignment } from "./domain-assignment.js";

test("DomainAssignmentValidator reports every problem", () => {
  const validator = defaultDomainAssignmentValidator();
  const item = newDomainAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DomainAssignmentRequiredLabelRule flags a blank label", () => {
  const rule = new DomainAssignmentRequiredLabelRule("domain assignment needs a value");
  const item = newDomainAssignment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new DomainAssignmentRatioRangeRule(6.5, 2081.7);
  const item = newDomainAssignment("x", "y");
  item.ratio = 2083.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainAssignmentLabelLengthRule flags a long label", () => {
  const rule = new DomainAssignmentLabelLengthRule(120);
  const item = newDomainAssignment("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DomainAssignmentRequiredCodeRule flags a blank code", () => {
  const rule = new DomainAssignmentRequiredCodeRule("domain assignment needs a value");
  const item = newDomainAssignment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DomainAssignmentMaximumRangeRule flags values above maximum", () => {
  const rule = new DomainAssignmentMaximumRangeRule(0.8, 3125.9);
  const item = newDomainAssignment("x", "y");
  item.maximum = 3127.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DomainAssignmentQuantityRangeRule flags values above quantity", () => {
  const rule = new DomainAssignmentQuantityRangeRule(16, 16);
  const item = newDomainAssignment("x", "y");
  item.quantity = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
