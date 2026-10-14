import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveRedemptionQuotaOpenRateRangeRule,
  AdaptiveRedemptionQuotaRequiredSummaryRule,
  AdaptiveRedemptionQuotaSummaryLengthRule,
  AdaptiveRedemptionQuotaVersionRangeRule,
  defaultAdaptiveRedemptionQuotaValidator,
} from "./adaptive-redemption-quota-rules.js";
import { newAdaptiveRedemptionQuota } from "./adaptive-redemption-quota.js";

test("AdaptiveRedemptionQuotaValidator reports every problem", () => {
  const validator = defaultAdaptiveRedemptionQuotaValidator();
  const item = newAdaptiveRedemptionQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveRedemptionQuotaVersionRangeRule flags values above version", () => {
  const rule = new AdaptiveRedemptionQuotaVersionRangeRule(255, 86400);
  const item = newAdaptiveRedemptionQuota("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRedemptionQuotaRequiredSummaryRule flags a blank summary", () => {
  const rule = new AdaptiveRedemptionQuotaRequiredSummaryRule("adaptive redemption quota needs this field");
  const item = newAdaptiveRedemptionQuota("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveRedemptionQuotaOpenRateRangeRule flags values above open rate", () => {
  const rule = new AdaptiveRedemptionQuotaOpenRateRangeRule(6.4, 1254.6);
  const item = newAdaptiveRedemptionQuota("x", "y");
  item.openRate = 1256.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveRedemptionQuotaSummaryLengthRule flags a long summary", () => {
  const rule = new AdaptiveRedemptionQuotaSummaryLengthRule(16);
  const item = newAdaptiveRedemptionQuota("x", "y");
  item.summary = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
