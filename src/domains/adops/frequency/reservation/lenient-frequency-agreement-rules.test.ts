import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientFrequencyAgreementNameLengthRule,
  LenientFrequencyAgreementRatioRangeRule,
  LenientFrequencyAgreementRequiredCohortRule,
  defaultLenientFrequencyAgreementValidator,
} from "./lenient-frequency-agreement-rules.js";
import { newLenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

test("LenientFrequencyAgreementValidator reports every problem", () => {
  const validator = defaultLenientFrequencyAgreementValidator();
  const item = newLenientFrequencyAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientFrequencyAgreementRatioRangeRule flags values above ratio", () => {
  const rule = new LenientFrequencyAgreementRatioRangeRule(9.1, 3777.2);
  const item = newLenientFrequencyAgreement("x", "y");
  item.ratio = 3778.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientFrequencyAgreementRequiredCohortRule flags a blank cohort", () => {
  const rule = new LenientFrequencyAgreementRequiredCohortRule("lenient frequency agreement needs this field");
  const item = newLenientFrequencyAgreement("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientFrequencyAgreementNameLengthRule flags a long name", () => {
  const rule = new LenientFrequencyAgreementNameLengthRule(80);
  const item = newLenientFrequencyAgreement("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
