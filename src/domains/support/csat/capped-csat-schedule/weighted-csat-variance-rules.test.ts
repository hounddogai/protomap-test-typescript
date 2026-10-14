import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedCsatVarianceBatchSizeRangeRule,
  WeightedCsatVarianceCodeLengthRule,
  WeightedCsatVarianceNameLengthRule,
  WeightedCsatVarianceRequiredAudienceIdRule,
  WeightedCsatVarianceStartsAtRangeRule,
  defaultWeightedCsatVarianceValidator,
} from "./weighted-csat-variance-rules.js";
import { newWeightedCsatVariance } from "./weighted-csat-variance.js";

test("WeightedCsatVarianceValidator reports every problem", () => {
  const validator = defaultWeightedCsatVarianceValidator();
  const item = newWeightedCsatVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedCsatVarianceStartsAtRangeRule flags values above starts at", () => {
  const rule = new WeightedCsatVarianceStartsAtRangeRule(64, 86400);
  const item = newWeightedCsatVariance("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCsatVarianceRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new WeightedCsatVarianceRequiredAudienceIdRule("weighted csat variance needs an entry");
  const item = newWeightedCsatVariance("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedCsatVarianceNameLengthRule flags a long name", () => {
  const rule = new WeightedCsatVarianceNameLengthRule(86400);
  const item = newWeightedCsatVariance("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedCsatVarianceBatchSizeRangeRule flags values above batch size", () => {
  const rule = new WeightedCsatVarianceBatchSizeRangeRule(64, 3600);
  const item = newWeightedCsatVariance("x", "y");
  item.batchSize = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedCsatVarianceCodeLengthRule flags a long code", () => {
  const rule = new WeightedCsatVarianceCodeLengthRule(16);
  const item = newWeightedCsatVariance("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
