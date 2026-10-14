import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalRewardThresholdCountryLengthRule,
  SeasonalRewardThresholdPriorityRangeRule,
  SeasonalRewardThresholdRequiredChannelRule,
  defaultSeasonalRewardThresholdValidator,
} from "./seasonal-reward-threshold-rules.js";
import { newSeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

test("SeasonalRewardThresholdValidator reports every problem", () => {
  const validator = defaultSeasonalRewardThresholdValidator();
  const item = newSeasonalRewardThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalRewardThresholdCountryLengthRule flags a long country", () => {
  const rule = new SeasonalRewardThresholdCountryLengthRule(64);
  const item = newSeasonalRewardThreshold("x", "y");
  item.country = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalRewardThresholdRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalRewardThresholdRequiredChannelRule("seasonal reward threshold needs a value");
  const item = newSeasonalRewardThreshold("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalRewardThresholdPriorityRangeRule flags values above priority", () => {
  const rule = new SeasonalRewardThresholdPriorityRangeRule(64, 80);
  const item = newSeasonalRewardThreshold("x", "y");
  item.priority = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
