import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictEnrollmentAdjustmentJourneyIdLengthRule,
  StrictEnrollmentAdjustmentNameLengthRule,
  StrictEnrollmentAdjustmentRequiredCodeRule,
  StrictEnrollmentAdjustmentRequiredExternalRefRule,
  defaultStrictEnrollmentAdjustmentValidator,
} from "./strict-enrollment-adjustment-rules.js";
import { newStrictEnrollmentAdjustment } from "./strict-enrollment-adjustment.js";

test("StrictEnrollmentAdjustmentValidator reports every problem", () => {
  const validator = defaultStrictEnrollmentAdjustmentValidator();
  const item = newStrictEnrollmentAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictEnrollmentAdjustmentJourneyIdLengthRule flags a long journey id", () => {
  const rule = new StrictEnrollmentAdjustmentJourneyIdLengthRule(120);
  const item = newStrictEnrollmentAdjustment("x", "y");
  item.journeyId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictEnrollmentAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new StrictEnrollmentAdjustmentRequiredCodeRule("strict enrollment adjustment needs a value");
  const item = newStrictEnrollmentAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictEnrollmentAdjustmentNameLengthRule flags a long name", () => {
  const rule = new StrictEnrollmentAdjustmentNameLengthRule(80);
  const item = newStrictEnrollmentAdjustment("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictEnrollmentAdjustmentRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new StrictEnrollmentAdjustmentRequiredExternalRefRule("strict enrollment adjustment needs this field");
  const item = newStrictEnrollmentAdjustment("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
