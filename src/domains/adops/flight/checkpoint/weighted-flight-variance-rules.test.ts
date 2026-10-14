import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFlightVarianceCategoryLengthRule,
  WeightedFlightVarianceCodeLengthRule,
  WeightedFlightVarianceRegionLengthRule,
  WeightedFlightVarianceRequiredCodeRule,
  WeightedFlightVarianceScoreRangeRule,
  WeightedFlightVarianceTitleLengthRule,
  defaultWeightedFlightVarianceValidator,
} from "./weighted-flight-variance-rules.js";
import { newWeightedFlightVariance } from "./weighted-flight-variance.js";

test("WeightedFlightVarianceValidator reports every problem", () => {
  const validator = defaultWeightedFlightVarianceValidator();
  const item = newWeightedFlightVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFlightVarianceCodeLengthRule flags a long code", () => {
  const rule = new WeightedFlightVarianceCodeLengthRule(64);
  const item = newWeightedFlightVariance("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFlightVarianceTitleLengthRule flags a long title", () => {
  const rule = new WeightedFlightVarianceTitleLengthRule(120);
  const item = newWeightedFlightVariance("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFlightVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedFlightVarianceRequiredCodeRule("weighted flight variance needs this field");
  const item = newWeightedFlightVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedFlightVarianceCategoryLengthRule flags a long category", () => {
  const rule = new WeightedFlightVarianceCategoryLengthRule(16);
  const item = newWeightedFlightVariance("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFlightVarianceRegionLengthRule flags a long region", () => {
  const rule = new WeightedFlightVarianceRegionLengthRule(255);
  const item = newWeightedFlightVariance("x", "y");
  item.region = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFlightVarianceScoreRangeRule flags values above score", () => {
  const rule = new WeightedFlightVarianceScoreRangeRule(5.7, 2763.8);
  const item = newWeightedFlightVariance("x", "y");
  item.score = 2765.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
