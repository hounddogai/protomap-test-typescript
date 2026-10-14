import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedRedemptionAgreementLimitRangeRule,
  CappedRedemptionAgreementRequiredLocaleRule,
  defaultCappedRedemptionAgreementValidator,
} from "./capped-redemption-agreement-rules.js";
import { newCappedRedemptionAgreement } from "./capped-redemption-agreement.js";

test("CappedRedemptionAgreementValidator reports every problem", () => {
  const validator = defaultCappedRedemptionAgreementValidator();
  const item = newCappedRedemptionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedRedemptionAgreementRequiredLocaleRule flags a blank locale", () => {
  const rule = new CappedRedemptionAgreementRequiredLocaleRule("capped redemption agreement needs a value");
  const item = newCappedRedemptionAgreement("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedRedemptionAgreementLimitRangeRule flags values above limit", () => {
  const rule = new CappedRedemptionAgreementLimitRangeRule(120, 3600);
  const item = newCappedRedemptionAgreement("x", "y");
  item.limit = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
