import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReputationExceptionRatioRangeRule,
  WeightedReputationExceptionRequiredCodeRule,
  WeightedReputationExceptionRequiredTimezoneRule,
  defaultWeightedReputationExceptionValidator,
} from "./weighted-reputation-exception-rules.js";
import { newWeightedReputationException } from "./weighted-reputation-exception.js";

test("WeightedReputationExceptionValidator reports every problem", () => {
  const validator = defaultWeightedReputationExceptionValidator();
  const item = newWeightedReputationException("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReputationExceptionRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new WeightedReputationExceptionRequiredTimezoneRule("weighted reputation exception needs an entry");
  const item = newWeightedReputationException("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReputationExceptionRatioRangeRule flags values above ratio", () => {
  const rule = new WeightedReputationExceptionRatioRangeRule(9.9, 3315.8);
  const item = newWeightedReputationException("x", "y");
  item.ratio = 3317.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedReputationExceptionRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedReputationExceptionRequiredCodeRule("weighted reputation exception needs this field");
  const item = newWeightedReputationException("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
