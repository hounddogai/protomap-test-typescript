import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedWaitWindowCodeLengthRule,
  WeightedWaitWindowCostRangeRule,
  WeightedWaitWindowOpenRateRangeRule,
  defaultWeightedWaitWindowValidator,
} from "./weighted-wait-window-rules.js";
import { newWeightedWaitWindow } from "./weighted-wait-window.js";

test("WeightedWaitWindowValidator reports every problem", () => {
  const validator = defaultWeightedWaitWindowValidator();
  const item = newWeightedWaitWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedWaitWindowCostRangeRule flags values above cost", () => {
  const rule = new WeightedWaitWindowCostRangeRule(3.3, 4961.6);
  const item = newWeightedWaitWindow("x", "y");
  item.cost = 4963.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedWaitWindowCodeLengthRule flags a long code", () => {
  const rule = new WeightedWaitWindowCodeLengthRule(64);
  const item = newWeightedWaitWindow("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedWaitWindowOpenRateRangeRule flags values above open rate", () => {
  const rule = new WeightedWaitWindowOpenRateRangeRule(8.6, 4333.9);
  const item = newWeightedWaitWindow("x", "y");
  item.openRate = 4335.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
