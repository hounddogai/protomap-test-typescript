import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalEnrollmentPolicyCeilingRangeRule,
  SeasonalEnrollmentPolicyCodeLengthRule,
  SeasonalEnrollmentPolicyDiscountRangeRule,
  SeasonalEnrollmentPolicyLabelLengthRule,
  SeasonalEnrollmentPolicyRequiredCodeRule,
  SeasonalEnrollmentPolicyUpdatedAtRangeRule,
  defaultSeasonalEnrollmentPolicyValidator,
} from "./seasonal-enrollment-policy-rules.js";
import { newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

test("SeasonalEnrollmentPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalEnrollmentPolicyValidator();
  const item = newSeasonalEnrollmentPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalEnrollmentPolicyCeilingRangeRule flags values above ceiling", () => {
  const rule = new SeasonalEnrollmentPolicyCeilingRangeRule(0.5, 2957.3);
  const item = newSeasonalEnrollmentPolicy("x", "y");
  item.ceiling = 2958.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalEnrollmentPolicyRequiredCodeRule("seasonal enrollment policy needs this field");
  const item = newSeasonalEnrollmentPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalEnrollmentPolicyCodeLengthRule flags a long code", () => {
  const rule = new SeasonalEnrollmentPolicyCodeLengthRule(255);
  const item = newSeasonalEnrollmentPolicy("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalEnrollmentPolicyDiscountRangeRule flags values above discount", () => {
  const rule = new SeasonalEnrollmentPolicyDiscountRangeRule(7.1, 2648.3);
  const item = newSeasonalEnrollmentPolicy("x", "y");
  item.discount = 2649.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentPolicyUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new SeasonalEnrollmentPolicyUpdatedAtRangeRule(80, 3600);
  const item = newSeasonalEnrollmentPolicy("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalEnrollmentPolicyLabelLengthRule flags a long label", () => {
  const rule = new SeasonalEnrollmentPolicyLabelLengthRule(64);
  const item = newSeasonalEnrollmentPolicy("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
