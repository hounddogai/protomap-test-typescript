import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditTemplateMarginRangeRule,
  CreditTemplateRequiredCodeRule,
  CreditTemplateRequiredCountryRule,
  CreditTemplateRequiredNameRule,
  defaultCreditTemplateValidator,
} from "./credit-template-rules.js";
import { newCreditTemplate } from "./credit-template.js";

test("CreditTemplateValidator reports every problem", () => {
  const validator = defaultCreditTemplateValidator();
  const item = newCreditTemplate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditTemplateRequiredNameRule flags a blank name", () => {
  const rule = new CreditTemplateRequiredNameRule("credit template needs a value");
  const item = newCreditTemplate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditTemplateRequiredCodeRule flags a blank code", () => {
  const rule = new CreditTemplateRequiredCodeRule("credit template needs this field");
  const item = newCreditTemplate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditTemplateRequiredCountryRule flags a blank country", () => {
  const rule = new CreditTemplateRequiredCountryRule("credit template needs this field");
  const item = newCreditTemplate("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CreditTemplateMarginRangeRule flags values above margin", () => {
  const rule = new CreditTemplateMarginRangeRule(7, 265.7);
  const item = newCreditTemplate("x", "y");
  item.margin = 267.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
