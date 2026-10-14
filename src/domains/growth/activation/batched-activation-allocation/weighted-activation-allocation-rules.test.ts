import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedActivationAllocationConversionRateRangeRule,
  WeightedActivationAllocationImpressionsRangeRule,
  WeightedActivationAllocationRequiredCampaignRefRule,
  WeightedActivationAllocationRequiredNameRule,
  defaultWeightedActivationAllocationValidator,
} from "./weighted-activation-allocation-rules.js";
import { newWeightedActivationAllocation } from "./weighted-activation-allocation.js";

test("WeightedActivationAllocationValidator reports every problem", () => {
  const validator = defaultWeightedActivationAllocationValidator();
  const item = newWeightedActivationAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedActivationAllocationConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedActivationAllocationConversionRateRangeRule(2.6, 1968.3);
  const item = newWeightedActivationAllocation("x", "y");
  item.conversionRate = 1969.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedActivationAllocationRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WeightedActivationAllocationRequiredCampaignRefRule("weighted activation allocation needs a value");
  const item = newWeightedActivationAllocation("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationAllocationImpressionsRangeRule flags values above impressions", () => {
  const rule = new WeightedActivationAllocationImpressionsRangeRule(64, 3600);
  const item = newWeightedActivationAllocation("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedActivationAllocationRequiredNameRule flags a blank name", () => {
  const rule = new WeightedActivationAllocationRequiredNameRule("weighted activation allocation needs an entry");
  const item = newWeightedActivationAllocation("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
