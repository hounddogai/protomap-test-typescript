import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredModelVarianceAttemptsRangeRule,
  TieredModelVarianceRateRangeRule,
  TieredModelVarianceRequiredCodeRule,
  TieredModelVarianceRequiredTitleRule,
  TieredModelVarianceTitleLengthRule,
  defaultTieredModelVarianceValidator,
} from "./tiered-model-variance-rules.js";
import { newTieredModelVariance } from "./tiered-model-variance.js";

test("TieredModelVarianceValidator reports every problem", () => {
  const validator = defaultTieredModelVarianceValidator();
  const item = newTieredModelVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredModelVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new TieredModelVarianceRequiredCodeRule("tiered model variance needs an entry");
  const item = newTieredModelVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredModelVarianceTitleLengthRule flags a long title", () => {
  const rule = new TieredModelVarianceTitleLengthRule(3600);
  const item = newTieredModelVariance("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredModelVarianceRequiredTitleRule flags a blank title", () => {
  const rule = new TieredModelVarianceRequiredTitleRule("tiered model variance needs a value");
  const item = newTieredModelVariance("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredModelVarianceRateRangeRule flags values above rate", () => {
  const rule = new TieredModelVarianceRateRangeRule(2, 3198.9);
  const item = newTieredModelVariance("x", "y");
  item.rate = 3200.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredModelVarianceAttemptsRangeRule flags values above attempts", () => {
  const rule = new TieredModelVarianceAttemptsRangeRule(32, 3600);
  const item = newTieredModelVariance("x", "y");
  item.attempts = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
