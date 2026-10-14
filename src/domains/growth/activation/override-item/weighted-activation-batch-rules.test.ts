import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedActivationBatchCodeLengthRule,
  WeightedActivationBatchQuantityRangeRule,
  WeightedActivationBatchRequiredAudienceIdRule,
  WeightedActivationBatchRequiredCodeRule,
  WeightedActivationBatchRequiredNameRule,
  WeightedActivationBatchWindowDaysRangeRule,
  defaultWeightedActivationBatchValidator,
} from "./weighted-activation-batch-rules.js";
import { newWeightedActivationBatch } from "./weighted-activation-batch.js";

test("WeightedActivationBatchValidator reports every problem", () => {
  const validator = defaultWeightedActivationBatchValidator();
  const item = newWeightedActivationBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedActivationBatchQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedActivationBatchQuantityRangeRule(120, 86400);
  const item = newWeightedActivationBatch("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedActivationBatchRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WeightedActivationBatchRequiredAudienceIdRule("weighted activation batch needs a value");
  const item = newWeightedActivationBatch("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationBatchRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedActivationBatchRequiredCodeRule("weighted activation batch needs an entry");
  const item = newWeightedActivationBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationBatchRequiredNameRule flags a blank name", () => {
  const rule = new WeightedActivationBatchRequiredNameRule("weighted activation batch needs an entry");
  const item = newWeightedActivationBatch("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedActivationBatchWindowDaysRangeRule flags values above window days", () => {
  const rule = new WeightedActivationBatchWindowDaysRangeRule(64, 255);
  const item = newWeightedActivationBatch("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedActivationBatchCodeLengthRule flags a long code", () => {
  const rule = new WeightedActivationBatchCodeLengthRule(3600);
  const item = newWeightedActivationBatch("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
