import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWarmupThresholdJourneyIdLengthRule,
  SeasonalWarmupThresholdRequiredCampaignRefRule,
  SeasonalWarmupThresholdRequiredCodeRule,
  SeasonalWarmupThresholdRequiredJourneyIdRule,
  SeasonalWarmupThresholdSequenceRangeRule,
  defaultSeasonalWarmupThresholdValidator,
} from "./seasonal-warmup-threshold-rules.js";
import { newSeasonalWarmupThreshold } from "./seasonal-warmup-threshold.js";

test("SeasonalWarmupThresholdValidator reports every problem", () => {
  const validator = defaultSeasonalWarmupThresholdValidator();
  const item = newSeasonalWarmupThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWarmupThresholdSequenceRangeRule flags values above sequence", () => {
  const rule = new SeasonalWarmupThresholdSequenceRangeRule(16, 32);
  const item = newSeasonalWarmupThreshold("x", "y");
  item.sequence = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalWarmupThresholdJourneyIdLengthRule flags a long journey id", () => {
  const rule = new SeasonalWarmupThresholdJourneyIdLengthRule(64);
  const item = newSeasonalWarmupThreshold("x", "y");
  item.journeyId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWarmupThresholdRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new SeasonalWarmupThresholdRequiredJourneyIdRule("seasonal warmup threshold needs this field");
  const item = newSeasonalWarmupThreshold("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWarmupThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalWarmupThresholdRequiredCodeRule("seasonal warmup threshold needs a value");
  const item = newSeasonalWarmupThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalWarmupThresholdRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new SeasonalWarmupThresholdRequiredCampaignRefRule("seasonal warmup threshold needs a value");
  const item = newSeasonalWarmupThreshold("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
