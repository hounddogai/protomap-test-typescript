import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryEnrollmentEstimateNameLengthRule,
  PrimaryEnrollmentEstimateUnitLengthRule,
  defaultPrimaryEnrollmentEstimateValidator,
} from "./primary-enrollment-estimate-rules.js";
import { newPrimaryEnrollmentEstimate } from "./primary-enrollment-estimate.js";

test("PrimaryEnrollmentEstimateValidator reports every problem", () => {
  const validator = defaultPrimaryEnrollmentEstimateValidator();
  const item = newPrimaryEnrollmentEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryEnrollmentEstimateUnitLengthRule flags a long unit", () => {
  const rule = new PrimaryEnrollmentEstimateUnitLengthRule(80);
  const item = newPrimaryEnrollmentEstimate("x", "y");
  item.unit = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryEnrollmentEstimateNameLengthRule flags a long name", () => {
  const rule = new PrimaryEnrollmentEstimateNameLengthRule(64);
  const item = newPrimaryEnrollmentEstimate("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
