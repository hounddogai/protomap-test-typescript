import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedMacroScoreMaximumRangeRule,
  WeightedMacroScoreQuantityRangeRule,
  WeightedMacroScoreRequiredCampaignRefRule,
  WeightedMacroScoreRequiredLabelRule,
  defaultWeightedMacroScoreValidator,
} from "./weighted-macro-score-rules.js";
import { newWeightedMacroScore } from "./weighted-macro-score.js";

test("WeightedMacroScoreValidator reports every problem", () => {
  const validator = defaultWeightedMacroScoreValidator();
  const item = newWeightedMacroScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedMacroScoreRequiredCampaignRefRule flags a blank campaign ref", () => {
  const rule = new WeightedMacroScoreRequiredCampaignRefRule("weighted macro score needs a value");
  const item = newWeightedMacroScore("", "");
  item.campaignRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedMacroScoreRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedMacroScoreRequiredLabelRule("weighted macro score needs an entry");
  const item = newWeightedMacroScore("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedMacroScoreQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedMacroScoreQuantityRangeRule(255, 1000);
  const item = newWeightedMacroScore("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedMacroScoreMaximumRangeRule flags values above maximum", () => {
  const rule = new WeightedMacroScoreMaximumRangeRule(1.5, 4252.2);
  const item = newWeightedMacroScore("x", "y");
  item.maximum = 4253.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
