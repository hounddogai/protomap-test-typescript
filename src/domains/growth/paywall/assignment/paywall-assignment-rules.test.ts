import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PaywallAssignmentCodeLengthRule,
  PaywallAssignmentCountryLengthRule,
  PaywallAssignmentRequiredCountryRule,
  PaywallAssignmentUpdatedAtRangeRule,
  PaywallAssignmentVariantLengthRule,
  defaultPaywallAssignmentValidator,
} from "./paywall-assignment-rules.js";
import { newPaywallAssignment } from "./paywall-assignment.js";

test("PaywallAssignmentValidator reports every problem", () => {
  const validator = defaultPaywallAssignmentValidator();
  const item = newPaywallAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PaywallAssignmentVariantLengthRule flags a long variant", () => {
  const rule = new PaywallAssignmentVariantLengthRule(120);
  const item = newPaywallAssignment("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallAssignmentCountryLengthRule flags a long country", () => {
  const rule = new PaywallAssignmentCountryLengthRule(64);
  const item = newPaywallAssignment("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PaywallAssignmentUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PaywallAssignmentUpdatedAtRangeRule(80, 3600);
  const item = newPaywallAssignment("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PaywallAssignmentRequiredCountryRule flags a blank country", () => {
  const rule = new PaywallAssignmentRequiredCountryRule("paywall assignment needs a value");
  const item = newPaywallAssignment("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PaywallAssignmentCodeLengthRule flags a long code", () => {
  const rule = new PaywallAssignmentCodeLengthRule(64);
  const item = newPaywallAssignment("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
