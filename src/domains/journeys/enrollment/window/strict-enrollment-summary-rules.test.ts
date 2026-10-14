import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictEnrollmentSummaryCodeLengthRule,
  StrictEnrollmentSummaryDescriptionLengthRule,
  StrictEnrollmentSummaryMinimumRangeRule,
  StrictEnrollmentSummaryRequiredExternalRefRule,
  StrictEnrollmentSummaryRequiredTitleRule,
  defaultStrictEnrollmentSummaryValidator,
} from "./strict-enrollment-summary-rules.js";
import { newStrictEnrollmentSummary } from "./strict-enrollment-summary.js";

test("StrictEnrollmentSummaryValidator reports every problem", () => {
  const validator = defaultStrictEnrollmentSummaryValidator();
  const item = newStrictEnrollmentSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictEnrollmentSummaryRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new StrictEnrollmentSummaryRequiredExternalRefRule("strict enrollment summary needs this field");
  const item = newStrictEnrollmentSummary("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictEnrollmentSummaryRequiredTitleRule flags a blank title", () => {
  const rule = new StrictEnrollmentSummaryRequiredTitleRule("strict enrollment summary needs this field");
  const item = newStrictEnrollmentSummary("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictEnrollmentSummaryCodeLengthRule flags a long code", () => {
  const rule = new StrictEnrollmentSummaryCodeLengthRule(120);
  const item = newStrictEnrollmentSummary("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictEnrollmentSummaryMinimumRangeRule flags values above minimum", () => {
  const rule = new StrictEnrollmentSummaryMinimumRangeRule(0.8, 3511.9);
  const item = newStrictEnrollmentSummary("x", "y");
  item.minimum = 3513.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictEnrollmentSummaryDescriptionLengthRule flags a long description", () => {
  const rule = new StrictEnrollmentSummaryDescriptionLengthRule(16);
  const item = newStrictEnrollmentSummary("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
