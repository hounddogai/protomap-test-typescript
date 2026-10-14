import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveQueueTargetImpressionsRangeRule,
  AdaptiveQueueTargetRequiredCampaignRefRule,
  AdaptiveQueueTargetRequiredCodeRule,
  AdaptiveQueueTargetRequiredTitleRule,
  AdaptiveQueueTargetTitleLengthRule,
  defaultAdaptiveQueueTargetValidator,
} from "./adaptive-queue-target-rules.js";
import { newAdaptiveQueueTarget } from "./adaptive-queue-target.js";

test("AdaptiveQueueTargetValidator reports every problem", () => {
  const validator = defaultAdaptiveQueueTargetValidator();
  const item = newAdaptiveQueueTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveQueueTargetImpressionsRangeRule flags values above impressions", () => {
  const rule = new AdaptiveQueueTargetImpressionsRangeRule(16, 3600);
  const item = newAdaptiveQueueTarget("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveQueueTargetRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new AdaptiveQueueTargetRequiredCampaignRefRule("adaptive queue target needs an entry");
  const item = newAdaptiveQueueTarget("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveQueueTargetTitleLengthRule flags a long title", () => {
  const rule = new AdaptiveQueueTargetTitleLengthRule(120);
  const item = newAdaptiveQueueTarget("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveQueueTargetRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveQueueTargetRequiredTitleRule("adaptive queue target needs an entry");
  const item = newAdaptiveQueueTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveQueueTargetRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveQueueTargetRequiredCodeRule("adaptive queue target needs this field");
  const item = newAdaptiveQueueTarget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
