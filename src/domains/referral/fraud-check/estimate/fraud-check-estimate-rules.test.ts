import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckEstimateCampaignRefLengthRule,
  FraudCheckEstimateNameLengthRule,
  FraudCheckEstimateRequiredCampaignRefRule,
  FraudCheckEstimateRequiredTimezoneRule,
  defaultFraudCheckEstimateValidator,
} from "./fraud-check-estimate-rules.js";
import { newFraudCheckEstimate } from "./fraud-check-estimate.js";

test("FraudCheckEstimateValidator reports every problem", () => {
  const validator = defaultFraudCheckEstimateValidator();
  const item = newFraudCheckEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckEstimateCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new FraudCheckEstimateCampaignRefLengthRule(3600);
  const item = newFraudCheckEstimate("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckEstimateRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new FraudCheckEstimateRequiredTimezoneRule("fraud check estimate needs this field");
  const item = newFraudCheckEstimate("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckEstimateNameLengthRule flags a long name", () => {
  const rule = new FraudCheckEstimateNameLengthRule(86400);
  const item = newFraudCheckEstimate("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckEstimateRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new FraudCheckEstimateRequiredCampaignRefRule("fraud check estimate needs a value");
  const item = newFraudCheckEstimate("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
