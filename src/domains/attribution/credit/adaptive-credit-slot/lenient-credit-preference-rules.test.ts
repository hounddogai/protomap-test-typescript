import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCreditPreferenceCodeLengthRule,
  LenientCreditPreferenceFrequencyCapRangeRule,
  LenientCreditPreferenceRequiredContactEmailRule,
  LenientCreditPreferenceRequiredTitleRule,
  LenientCreditPreferenceSummaryLengthRule,
  defaultLenientCreditPreferenceValidator,
} from "./lenient-credit-preference-rules.js";
import { newLenientCreditPreference } from "./lenient-credit-preference.js";

test("LenientCreditPreferenceValidator reports every problem", () => {
  const validator = defaultLenientCreditPreferenceValidator();
  const item = newLenientCreditPreference("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCreditPreferenceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new LenientCreditPreferenceRequiredContactEmailRule("lenient credit preference needs an entry");
  const item = newLenientCreditPreference("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientCreditPreferenceSummaryLengthRule flags a long summary", () => {
  const rule = new LenientCreditPreferenceSummaryLengthRule(120);
  const item = newLenientCreditPreference("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCreditPreferenceCodeLengthRule flags a long code", () => {
  const rule = new LenientCreditPreferenceCodeLengthRule(16);
  const item = newLenientCreditPreference("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCreditPreferenceFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LenientCreditPreferenceFrequencyCapRangeRule(16, 32);
  const item = newLenientCreditPreference("x", "y");
  item.frequencyCap = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCreditPreferenceRequiredTitleRule flags a blank title", () => {
  const rule = new LenientCreditPreferenceRequiredTitleRule("lenient credit preference needs a value");
  const item = newLenientCreditPreference("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
