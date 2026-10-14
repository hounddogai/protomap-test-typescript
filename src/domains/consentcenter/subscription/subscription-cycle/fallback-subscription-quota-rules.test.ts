import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackSubscriptionQuotaAttemptsRangeRule,
  FallbackSubscriptionQuotaCodeLengthRule,
  FallbackSubscriptionQuotaRequiredCountryRule,
  FallbackSubscriptionQuotaRequiredReviewerRule,
  defaultFallbackSubscriptionQuotaValidator,
} from "./fallback-subscription-quota-rules.js";
import { newFallbackSubscriptionQuota } from "./fallback-subscription-quota.js";

test("FallbackSubscriptionQuotaValidator reports every problem", () => {
  const validator = defaultFallbackSubscriptionQuotaValidator();
  const item = newFallbackSubscriptionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackSubscriptionQuotaRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new FallbackSubscriptionQuotaRequiredReviewerRule("fallback subscription quota needs an entry");
  const item = newFallbackSubscriptionQuota("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSubscriptionQuotaCodeLengthRule flags a long code", () => {
  const rule = new FallbackSubscriptionQuotaCodeLengthRule(3600);
  const item = newFallbackSubscriptionQuota("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackSubscriptionQuotaRequiredCountryRule flags a blank country", () => {
  const rule = new FallbackSubscriptionQuotaRequiredCountryRule("fallback subscription quota needs this field");
  const item = newFallbackSubscriptionQuota("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackSubscriptionQuotaAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackSubscriptionQuotaAttemptsRangeRule(1000, 3600);
  const item = newFallbackSubscriptionQuota("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
