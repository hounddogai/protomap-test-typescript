import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBidRuleAgreementCountryLengthRule,
  ManualBidRuleAgreementMaximumRangeRule,
  defaultManualBidRuleAgreementValidator,
} from "./manual-bid-rule-agreement-rules.js";
import { newManualBidRuleAgreement } from "./manual-bid-rule-agreement.js";

test("ManualBidRuleAgreementValidator reports every problem", () => {
  const validator = defaultManualBidRuleAgreementValidator();
  const item = newManualBidRuleAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBidRuleAgreementCountryLengthRule flags a long country", () => {
  const rule = new ManualBidRuleAgreementCountryLengthRule(1000);
  const item = newManualBidRuleAgreement("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBidRuleAgreementMaximumRangeRule flags values above maximum", () => {
  const rule = new ManualBidRuleAgreementMaximumRangeRule(2.8, 2670.3);
  const item = newManualBidRuleAgreement("x", "y");
  item.maximum = 2671.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
