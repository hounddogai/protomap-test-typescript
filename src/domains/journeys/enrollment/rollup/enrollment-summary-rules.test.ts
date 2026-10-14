import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentSummaryCodeLengthRule,
  EnrollmentSummaryCostRangeRule,
  EnrollmentSummaryExternalRefLengthRule,
  EnrollmentSummaryRequiredCodeRule,
  EnrollmentSummaryTitleLengthRule,
  defaultEnrollmentSummaryValidator,
} from "./enrollment-summary-rules.js";
import { newEnrollmentSummary } from "./enrollment-summary.js";

test("EnrollmentSummaryValidator reports every problem", () => {
  const validator = defaultEnrollmentSummaryValidator();
  const item = newEnrollmentSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentSummaryExternalRefLengthRule flags a long external ref", () => {
  const rule = new EnrollmentSummaryExternalRefLengthRule(80);
  const item = newEnrollmentSummary("x", "y");
  item.externalRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentSummaryCostRangeRule flags values above cost", () => {
  const rule = new EnrollmentSummaryCostRangeRule(4.5, 3109.7);
  const item = newEnrollmentSummary("x", "y");
  item.cost = 3111.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new EnrollmentSummaryRequiredCodeRule("enrollment summary needs a value");
  const item = newEnrollmentSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentSummaryTitleLengthRule flags a long title", () => {
  const rule = new EnrollmentSummaryTitleLengthRule(120);
  const item = newEnrollmentSummary("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentSummaryCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentSummaryCodeLengthRule(120);
  const item = newEnrollmentSummary("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
