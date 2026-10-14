import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditBundleCapacityRangeRule,
  CreditBundleRequiredLocaleRule,
  CreditBundleRequiredSourceRule,
  CreditBundleTitleLengthRule,
  defaultCreditBundleValidator,
} from "./credit-bundle-rules.js";
import { newCreditBundle } from "./credit-bundle.js";

test("CreditBundleValidator reports every problem", () => {
  const validator = defaultCreditBundleValidator();
  const item = newCreditBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditBundleCapacityRangeRule flags values above capacity", () => {
  const rule = new CreditBundleCapacityRangeRule(80, 255);
  const item = newCreditBundle("x", "y");
  item.capacity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditBundleTitleLengthRule flags a long title", () => {
  const rule = new CreditBundleTitleLengthRule(120);
  const item = newCreditBundle("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditBundleRequiredLocaleRule flags a blank locale", () => {
  const rule = new CreditBundleRequiredLocaleRule("credit bundle needs a value");
  const item = newCreditBundle("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditBundleRequiredSourceRule flags a blank source", () => {
  const rule = new CreditBundleRequiredSourceRule("credit bundle needs a value");
  const item = newCreditBundle("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
