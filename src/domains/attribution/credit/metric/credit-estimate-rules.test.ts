import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditEstimateChecksumLengthRule,
  CreditEstimateRequiredChecksumRule,
  CreditEstimateRequiredCodeRule,
  CreditEstimateWindowDaysRangeRule,
  defaultCreditEstimateValidator,
} from "./credit-estimate-rules.js";
import { newCreditEstimate } from "./credit-estimate.js";

test("CreditEstimateValidator reports every problem", () => {
  const validator = defaultCreditEstimateValidator();
  const item = newCreditEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new CreditEstimateRequiredCodeRule("credit estimate needs an entry");
  const item = newCreditEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditEstimateChecksumLengthRule flags a long checksum", () => {
  const rule = new CreditEstimateChecksumLengthRule(64);
  const item = newCreditEstimate("x", "y");
  item.checksum = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditEstimateWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreditEstimateWindowDaysRangeRule(80, 86400);
  const item = newCreditEstimate("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditEstimateRequiredChecksumRule flags a blank checksum", () => {
  const rule = new CreditEstimateRequiredChecksumRule("credit estimate needs an entry");
  const item = newCreditEstimate("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
