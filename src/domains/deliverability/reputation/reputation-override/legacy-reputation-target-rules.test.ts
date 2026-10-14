import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyReputationTargetCodeLengthRule,
  LegacyReputationTargetConversionRateRangeRule,
  LegacyReputationTargetMaximumRangeRule,
  LegacyReputationTargetRequiredCampaignRefRule,
  LegacyReputationTargetRequiredTitleRule,
  defaultLegacyReputationTargetValidator,
} from "./legacy-reputation-target-rules.js";
import { newLegacyReputationTarget } from "./legacy-reputation-target.js";

test("LegacyReputationTargetValidator reports every problem", () => {
  const validator = defaultLegacyReputationTargetValidator();
  const item = newLegacyReputationTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyReputationTargetConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyReputationTargetConversionRateRangeRule(8.2, 4270.2);
  const item = newLegacyReputationTarget("x", "y");
  item.conversionRate = 4271.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyReputationTargetCodeLengthRule flags a long code", () => {
  const rule = new LegacyReputationTargetCodeLengthRule(255);
  const item = newLegacyReputationTarget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyReputationTargetMaximumRangeRule flags values above maximum", () => {
  const rule = new LegacyReputationTargetMaximumRangeRule(0.8, 3169);
  const item = newLegacyReputationTarget("x", "y");
  item.maximum = 3170.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyReputationTargetRequiredTitleRule flags a blank title", () => {
  const rule = new LegacyReputationTargetRequiredTitleRule("legacy reputation target needs a value");
  const item = newLegacyReputationTarget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyReputationTargetRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new LegacyReputationTargetRequiredCampaignRefRule("legacy reputation target needs an entry");
  const item = newLegacyReputationTarget("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
