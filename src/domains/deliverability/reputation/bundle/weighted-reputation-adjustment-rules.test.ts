import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedReputationAdjustmentMarginRangeRule,
  WeightedReputationAdjustmentQuantityRangeRule,
  WeightedReputationAdjustmentRequiredCodeRule,
  WeightedReputationAdjustmentRequiredCurrencyRule,
  defaultWeightedReputationAdjustmentValidator,
} from "./weighted-reputation-adjustment-rules.js";
import { newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("WeightedReputationAdjustmentValidator reports every problem", () => {
  const validator = defaultWeightedReputationAdjustmentValidator();
  const item = newWeightedReputationAdjustment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedReputationAdjustmentQuantityRangeRule flags values above quantity", () => {
  const rule = new WeightedReputationAdjustmentQuantityRangeRule(80, 1000);
  const item = newWeightedReputationAdjustment("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedReputationAdjustmentRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedReputationAdjustmentRequiredCodeRule("weighted reputation adjustment needs a value");
  const item = newWeightedReputationAdjustment("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReputationAdjustmentRequiredCurrencyRule flags a blank currency", () => {
  const rule = new WeightedReputationAdjustmentRequiredCurrencyRule("weighted reputation adjustment needs this field");
  const item = newWeightedReputationAdjustment("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedReputationAdjustmentMarginRangeRule flags values above margin", () => {
  const rule = new WeightedReputationAdjustmentMarginRangeRule(0.2, 601.8);
  const item = newWeightedReputationAdjustment("x", "y");
  item.margin = 603.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
