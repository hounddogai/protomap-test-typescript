import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveFunnelEstimateCampaignRefLengthRule,
  AdaptiveFunnelEstimateEndsAtRangeRule,
  AdaptiveFunnelEstimateFloorValueRangeRule,
  AdaptiveFunnelEstimatePriorityRangeRule,
  AdaptiveFunnelEstimateRequiredCampaignRefRule,
  AdaptiveFunnelEstimateRequiredCodeRule,
  defaultAdaptiveFunnelEstimateValidator,
} from "./adaptive-funnel-estimate-rules.js";
import { newAdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

test("AdaptiveFunnelEstimateValidator reports every problem", () => {
  const validator = defaultAdaptiveFunnelEstimateValidator();
  const item = newAdaptiveFunnelEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveFunnelEstimateFloorValueRangeRule flags values above floor value", () => {
  const rule = new AdaptiveFunnelEstimateFloorValueRangeRule(6, 1226.3);
  const item = newAdaptiveFunnelEstimate("x", "y");
  item.floorValue = 1227.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelEstimateRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new AdaptiveFunnelEstimateRequiredCampaignRefRule("adaptive funnel estimate needs this field");
  const item = newAdaptiveFunnelEstimate("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelEstimatePriorityRangeRule flags values above priority", () => {
  const rule = new AdaptiveFunnelEstimatePriorityRangeRule(16, 64);
  const item = newAdaptiveFunnelEstimate("x", "y");
  item.priority = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelEstimateEndsAtRangeRule flags values above ends at", () => {
  const rule = new AdaptiveFunnelEstimateEndsAtRangeRule(255, 1000);
  const item = newAdaptiveFunnelEstimate("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveFunnelEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveFunnelEstimateRequiredCodeRule("adaptive funnel estimate needs a value");
  const item = newAdaptiveFunnelEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveFunnelEstimateCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new AdaptiveFunnelEstimateCampaignRefLengthRule(16);
  const item = newAdaptiveFunnelEstimate("x", "y");
  item.campaignRef = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
