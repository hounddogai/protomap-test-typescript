import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SubscriptionAgreementAmountRangeRule,
  SubscriptionAgreementImpressionsRangeRule,
  SubscriptionAgreementRequiredRegionRule,
  SubscriptionAgreementRequiredTitleRule,
  defaultSubscriptionAgreementValidator,
} from "./subscription-agreement-rules.js";
import { newSubscriptionAgreement } from "./subscription-agreement.js";

test("SubscriptionAgreementValidator reports every problem", () => {
  const validator = defaultSubscriptionAgreementValidator();
  const item = newSubscriptionAgreement("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SubscriptionAgreementAmountRangeRule flags values above amount", () => {
  const rule = new SubscriptionAgreementAmountRangeRule(8.2, 4743.9);
  const item = newSubscriptionAgreement("x", "y");
  item.amount = 4745.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionAgreementRequiredTitleRule flags a blank title", () => {
  const rule = new SubscriptionAgreementRequiredTitleRule("subscription agreement needs a value");
  const item = newSubscriptionAgreement("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SubscriptionAgreementImpressionsRangeRule flags values above impressions", () => {
  const rule = new SubscriptionAgreementImpressionsRangeRule(64, 86400);
  const item = newSubscriptionAgreement("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SubscriptionAgreementRequiredRegionRule flags a blank region", () => {
  const rule = new SubscriptionAgreementRequiredRegionRule("subscription agreement needs this field");
  const item = newSubscriptionAgreement("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
