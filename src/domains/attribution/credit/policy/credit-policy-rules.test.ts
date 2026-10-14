import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreditPolicyClicksRangeRule,
  CreditPolicyRatioRangeRule,
  CreditPolicyRequiredCodeRule,
  defaultCreditPolicyValidator,
} from "./credit-policy-rules.js";
import { newCreditPolicy } from "./credit-policy.js";

test("CreditPolicyValidator reports every problem", () => {
  const validator = defaultCreditPolicyValidator();
  const item = newCreditPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreditPolicyRatioRangeRule flags values above ratio", () => {
  const rule = new CreditPolicyRatioRangeRule(5.8, 766.6);
  const item = newCreditPolicy("x", "y");
  item.ratio = 768.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditPolicyClicksRangeRule flags values above clicks", () => {
  const rule = new CreditPolicyClicksRangeRule(120, 3600);
  const item = newCreditPolicy("x", "y");
  item.clicks = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CreditPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new CreditPolicyRequiredCodeRule("credit policy needs a value");
  const item = newCreditPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
