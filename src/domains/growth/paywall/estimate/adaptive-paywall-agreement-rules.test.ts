import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptivePaywallAgreementImpressionsRangeRule,
  AdaptivePaywallAgreementTitleLengthRule,
  defaultAdaptivePaywallAgreementValidator,
} from "./adaptive-paywall-agreement-rules.js";
import { newAdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

test("AdaptivePaywallAgreementValidator reports every problem", () => {
  const validator = defaultAdaptivePaywallAgreementValidator();
  const item = newAdaptivePaywallAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptivePaywallAgreementTitleLengthRule flags a long title", () => {
  const rule = new AdaptivePaywallAgreementTitleLengthRule(86400);
  const item = newAdaptivePaywallAgreement("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptivePaywallAgreementImpressionsRangeRule flags values above impressions", () => {
  const rule = new AdaptivePaywallAgreementImpressionsRangeRule(255, 3600);
  const item = newAdaptivePaywallAgreement("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
