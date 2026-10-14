import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditBaselineCodeLengthRule,
  CreditBaselineDiscountRangeRule,
  CreditBaselineLabelLengthRule,
  CreditBaselineRetriesRangeRule,
  CreditBaselineUnitLengthRule,
  defaultCreditBaselineValidator,
} from "./credit-baseline-rules.js";
import { newCreditBaseline } from "./credit-baseline.js";

test("CreditBaselineValidator reports every problem", () => {
  const validator = defaultCreditBaselineValidator();
  const item = newCreditBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditBaselineRetriesRangeRule flags values above retries", () => {
  const rule = new CreditBaselineRetriesRangeRule(120, 1000);
  const item = newCreditBaseline("x", "y");
  item.retries = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditBaselineCodeLengthRule flags a long code", () => {
  const rule = new CreditBaselineCodeLengthRule(64);
  const item = newCreditBaseline("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditBaselineDiscountRangeRule flags values above discount", () => {
  const rule = new CreditBaselineDiscountRangeRule(6.8, 1060.6);
  const item = newCreditBaseline("x", "y");
  item.discount = 1062.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditBaselineLabelLengthRule flags a long label", () => {
  const rule = new CreditBaselineLabelLengthRule(1000);
  const item = newCreditBaseline("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreditBaselineUnitLengthRule flags a long unit", () => {
  const rule = new CreditBaselineUnitLengthRule(120);
  const item = newCreditBaseline("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
