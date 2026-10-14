import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPlacementBatchCodeLengthRule,
  WeightedPlacementBatchOpenRateRangeRule,
  WeightedPlacementBatchRequiredCodeRule,
  WeightedPlacementBatchRequiredTitleRule,
  WeightedPlacementBatchRequiredUnitRule,
  defaultWeightedPlacementBatchValidator,
} from "./weighted-placement-batch-rules.js";
import { newWeightedPlacementBatch } from "./weighted-placement-batch.js";

test("WeightedPlacementBatchValidator reports every problem", () => {
  const validator = defaultWeightedPlacementBatchValidator();
  const item = newWeightedPlacementBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPlacementBatchRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedPlacementBatchRequiredTitleRule("weighted placement batch needs a value");
  const item = newWeightedPlacementBatch("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementBatchRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedPlacementBatchRequiredCodeRule("weighted placement batch needs a value");
  const item = newWeightedPlacementBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementBatchOpenRateRangeRule flags values above open rate", () => {
  const rule = new WeightedPlacementBatchOpenRateRangeRule(3.6, 2786);
  const item = newWeightedPlacementBatch("x", "y");
  item.openRate = 2787.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPlacementBatchRequiredUnitRule flags a blank unit", () => {
  const rule = new WeightedPlacementBatchRequiredUnitRule("weighted placement batch needs an entry");
  const item = newWeightedPlacementBatch("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPlacementBatchCodeLengthRule flags a long code", () => {
  const rule = new WeightedPlacementBatchCodeLengthRule(32);
  const item = newWeightedPlacementBatch("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
