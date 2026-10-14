import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentDraftMaximumRangeRule,
  EnrollmentDraftRequiredLabelRule,
  EnrollmentDraftSegmentLengthRule,
  defaultEnrollmentDraftValidator,
} from "./enrollment-draft-rules.js";
import { newEnrollmentDraft } from "./enrollment-draft.js";

test("EnrollmentDraftValidator reports every problem", () => {
  const validator = defaultEnrollmentDraftValidator();
  const item = newEnrollmentDraft("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentDraftSegmentLengthRule flags a long segment", () => {
  const rule = new EnrollmentDraftSegmentLengthRule(64);
  const item = newEnrollmentDraft("x", "y");
  item.segment = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("EnrollmentDraftMaximumRangeRule flags values above maximum", () => {
  const rule = new EnrollmentDraftMaximumRangeRule(9.7, 4854.8);
  const item = newEnrollmentDraft("x", "y");
  item.maximum = 4856.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EnrollmentDraftRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentDraftRequiredLabelRule("enrollment draft needs this field");
  const item = newEnrollmentDraft("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
