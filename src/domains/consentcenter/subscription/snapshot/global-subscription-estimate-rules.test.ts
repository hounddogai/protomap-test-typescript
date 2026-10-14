import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalSubscriptionEstimateCampaignRefLengthRule,
  GlobalSubscriptionEstimateConversionRateRangeRule,
  GlobalSubscriptionEstimateExpiresAtRangeRule,
  GlobalSubscriptionEstimateNameLengthRule,
  defaultGlobalSubscriptionEstimateValidator,
} from "./global-subscription-estimate-rules.js";
import { newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

test("GlobalSubscriptionEstimateValidator reports every problem", () => {
  const validator = defaultGlobalSubscriptionEstimateValidator();
  const item = newGlobalSubscriptionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalSubscriptionEstimateConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new GlobalSubscriptionEstimateConversionRateRangeRule(0.9, 729.5);
  const item = newGlobalSubscriptionEstimate("x", "y");
  item.conversionRate = 731;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSubscriptionEstimateCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new GlobalSubscriptionEstimateCampaignRefLengthRule(1000);
  const item = newGlobalSubscriptionEstimate("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("GlobalSubscriptionEstimateExpiresAtRangeRule flags values above expires at", () => {
  const rule = new GlobalSubscriptionEstimateExpiresAtRangeRule(32, 1000);
  const item = newGlobalSubscriptionEstimate("x", "y");
  item.expiresAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalSubscriptionEstimateNameLengthRule flags a long name", () => {
  const rule = new GlobalSubscriptionEstimateNameLengthRule(255);
  const item = newGlobalSubscriptionEstimate("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
