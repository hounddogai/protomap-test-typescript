import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientEnrollmentMilestoneAmountRangeRule,
  LenientEnrollmentMilestoneCodeLengthRule,
  LenientEnrollmentMilestoneCountryLengthRule,
  LenientEnrollmentMilestoneRequiredCodeRule,
  LenientEnrollmentMilestoneRequiredCountryRule,
  LenientEnrollmentMilestoneSequenceRangeRule,
  defaultLenientEnrollmentMilestoneValidator,
} from "./lenient-enrollment-milestone-rules.js";
import { newLenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

test("LenientEnrollmentMilestoneValidator reports every problem", () => {
  const validator = defaultLenientEnrollmentMilestoneValidator();
  const item = newLenientEnrollmentMilestone("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientEnrollmentMilestoneAmountRangeRule flags values above amount", () => {
  const rule = new LenientEnrollmentMilestoneAmountRangeRule(4.5, 2508.1);
  const item = newLenientEnrollmentMilestone("x", "y");
  item.amount = 2509.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientEnrollmentMilestoneRequiredCodeRule flags a blank code", () => {
  const rule = new LenientEnrollmentMilestoneRequiredCodeRule("lenient enrollment milestone needs an entry");
  const item = newLenientEnrollmentMilestone("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientEnrollmentMilestoneCountryLengthRule flags a long country", () => {
  const rule = new LenientEnrollmentMilestoneCountryLengthRule(64);
  const item = newLenientEnrollmentMilestone("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientEnrollmentMilestoneRequiredCountryRule flags a blank country", () => {
  const rule = new LenientEnrollmentMilestoneRequiredCountryRule("lenient enrollment milestone needs an entry");
  const item = newLenientEnrollmentMilestone("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientEnrollmentMilestoneCodeLengthRule flags a long code", () => {
  const rule = new LenientEnrollmentMilestoneCodeLengthRule(80);
  const item = newLenientEnrollmentMilestone("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientEnrollmentMilestoneSequenceRangeRule flags values above sequence", () => {
  const rule = new LenientEnrollmentMilestoneSequenceRangeRule(32, 64);
  const item = newLenientEnrollmentMilestone("x", "y");
  item.sequence = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
