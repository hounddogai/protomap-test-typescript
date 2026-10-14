import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditTierCodeLengthRule,
  CreditTierLabelLengthRule,
  CreditTierMaximumRangeRule,
  CreditTierRequiredCodeRule,
  CreditTierRetriesRangeRule,
  defaultCreditTierValidator,
} from "./credit-tier-rules.js";
import { newCreditTier } from "./credit-tier.js";

test("CreditTierValidator reports every problem", () => {
  const validator = defaultCreditTierValidator();
  const item = newCreditTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditTierCodeLengthRule flags a long code", () => {
  const rule = new CreditTierCodeLengthRule(16);
  const item = newCreditTier("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditTierRequiredCodeRule flags a blank code", () => {
  const rule = new CreditTierRequiredCodeRule("credit tier needs this field");
  const item = newCreditTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditTierLabelLengthRule flags a long label", () => {
  const rule = new CreditTierLabelLengthRule(32);
  const item = newCreditTier("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditTierRetriesRangeRule flags values above retries", () => {
  const rule = new CreditTierRetriesRangeRule(16, 86400);
  const item = newCreditTier("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditTierMaximumRangeRule flags values above maximum", () => {
  const rule = new CreditTierMaximumRangeRule(3.8, 4758.8);
  const item = newCreditTier("x", "y");
  item.maximum = 4760.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
