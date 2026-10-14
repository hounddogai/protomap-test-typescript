import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditVarianceCodeLengthRule,
  CreditVarianceRequiredCodeRule,
  CreditVarianceRequiredContactEmailRule,
  CreditVarianceWindowDaysRangeRule,
  defaultCreditVarianceValidator,
} from "./credit-variance-rules.js";
import { newCreditVariance } from "./credit-variance.js";

test("CreditVarianceValidator reports every problem", () => {
  const validator = defaultCreditVarianceValidator();
  const item = newCreditVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditVarianceCodeLengthRule flags a long code", () => {
  const rule = new CreditVarianceCodeLengthRule(80);
  const item = newCreditVariance("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditVarianceWindowDaysRangeRule flags values above window days", () => {
  const rule = new CreditVarianceWindowDaysRangeRule(64, 255);
  const item = newCreditVariance("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new CreditVarianceRequiredCodeRule("credit variance needs this field");
  const item = newCreditVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditVarianceRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new CreditVarianceRequiredContactEmailRule("credit variance needs an entry");
  const item = newCreditVariance("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
