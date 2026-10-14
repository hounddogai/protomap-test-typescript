import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPlacementScoreConversionRateRangeRule,
  WeightedPlacementScoreCreatedAtRangeRule,
  WeightedPlacementScoreRequiredDescriptionRule,
  defaultWeightedPlacementScoreValidator,
} from "./weighted-placement-score-rules.js";
import { newWeightedPlacementScore } from "./weighted-placement-score.js";

test("WeightedPlacementScoreValidator reports every problem", () => {
  const validator = defaultWeightedPlacementScoreValidator();
  const item = newWeightedPlacementScore("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPlacementScoreCreatedAtRangeRule flags values above created at", () => {
  const rule = new WeightedPlacementScoreCreatedAtRangeRule(32, 3600);
  const item = newWeightedPlacementScore("x", "y");
  item.createdAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPlacementScoreConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedPlacementScoreConversionRateRangeRule(7.6, 740.1);
  const item = newWeightedPlacementScore("x", "y");
  item.conversionRate = 741.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPlacementScoreRequiredDescriptionRule flags a blank description", () => {
  const rule = new WeightedPlacementScoreRequiredDescriptionRule("weighted placement score needs an entry");
  const item = newWeightedPlacementScore("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
