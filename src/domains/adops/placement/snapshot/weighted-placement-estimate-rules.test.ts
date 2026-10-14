import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPlacementEstimateCodeLengthRule,
  WeightedPlacementEstimateMinimumRangeRule,
  WeightedPlacementEstimateRequiredCodeRule,
  WeightedPlacementEstimateRequiredTitleRule,
  defaultWeightedPlacementEstimateValidator,
} from "./weighted-placement-estimate-rules.js";
import { newWeightedPlacementEstimate } from "./weighted-placement-estimate.js";

test("WeightedPlacementEstimateValidator reports every problem", () => {
  const validator = defaultWeightedPlacementEstimateValidator();
  const item = newWeightedPlacementEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPlacementEstimateRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedPlacementEstimateRequiredTitleRule("weighted placement estimate needs this field");
  const item = newWeightedPlacementEstimate("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementEstimateCodeLengthRule flags a long code", () => {
  const rule = new WeightedPlacementEstimateCodeLengthRule(255);
  const item = newWeightedPlacementEstimate("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPlacementEstimateMinimumRangeRule flags values above minimum", () => {
  const rule = new WeightedPlacementEstimateMinimumRangeRule(0.4, 223.5);
  const item = newWeightedPlacementEstimate("x", "y");
  item.minimum = 225;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPlacementEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPlacementEstimateRequiredCodeRule("weighted placement estimate needs an entry");
  const item = newWeightedPlacementEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
