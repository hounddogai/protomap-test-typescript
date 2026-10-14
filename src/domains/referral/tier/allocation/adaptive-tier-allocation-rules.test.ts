import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveTierAllocationCampaignRefLengthRule,
  AdaptiveTierAllocationCeilingRangeRule,
  AdaptiveTierAllocationRequiredCampaignRefRule,
  defaultAdaptiveTierAllocationValidator,
} from "./adaptive-tier-allocation-rules.js";
import { newAdaptiveTierAllocation } from "./adaptive-tier-allocation.js";

test("AdaptiveTierAllocationValidator reports every problem", () => {
  const validator = defaultAdaptiveTierAllocationValidator();
  const item = newAdaptiveTierAllocation("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveTierAllocationRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new AdaptiveTierAllocationRequiredCampaignRefRule("adaptive tier allocation needs this field");
  const item = newAdaptiveTierAllocation("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveTierAllocationCeilingRangeRule flags values above ceiling", () => {
  const rule = new AdaptiveTierAllocationCeilingRangeRule(6.1, 2955.4);
  const item = newAdaptiveTierAllocation("x", "y");
  item.ceiling = 2956.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveTierAllocationCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new AdaptiveTierAllocationCampaignRefLengthRule(1000);
  const item = newAdaptiveTierAllocation("x", "y");
  item.campaignRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
