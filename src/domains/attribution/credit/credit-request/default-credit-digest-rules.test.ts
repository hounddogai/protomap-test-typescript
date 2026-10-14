import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultCreditDigestCodeLengthRule,
  DefaultCreditDigestContactEmailLengthRule,
  DefaultCreditDigestConversionRateRangeRule,
  DefaultCreditDigestDurationMinutesRangeRule,
  DefaultCreditDigestRequiredContactEmailRule,
  defaultDefaultCreditDigestValidator,
} from "./default-credit-digest-rules.js";
import { newDefaultCreditDigest } from "./default-credit-digest.js";

test("DefaultCreditDigestValidator reports every problem", () => {
  const validator = defaultDefaultCreditDigestValidator();
  const item = newDefaultCreditDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultCreditDigestCodeLengthRule flags a long code", () => {
  const rule = new DefaultCreditDigestCodeLengthRule(32);
  const item = newDefaultCreditDigest("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCreditDigestDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultCreditDigestDurationMinutesRangeRule(16, 80);
  const item = newDefaultCreditDigest("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultCreditDigestRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new DefaultCreditDigestRequiredContactEmailRule("default credit digest needs this field");
  const item = newDefaultCreditDigest("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultCreditDigestContactEmailLengthRule flags a long contact email", () => {
  const rule = new DefaultCreditDigestContactEmailLengthRule(3600);
  const item = newDefaultCreditDigest("x", "y");
  item.contactEmail = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultCreditDigestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new DefaultCreditDigestConversionRateRangeRule(5.3, 1936.1);
  const item = newDefaultCreditDigest("x", "y");
  item.conversionRate = 1937.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
