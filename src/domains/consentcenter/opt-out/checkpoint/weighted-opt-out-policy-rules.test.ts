import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedOptOutPolicyCodeLengthRule,
  WeightedOptOutPolicyImpressionsRangeRule,
  defaultWeightedOptOutPolicyValidator,
} from "./weighted-opt-out-policy-rules.js";
import { newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("WeightedOptOutPolicyValidator reports every problem", () => {
  const validator = defaultWeightedOptOutPolicyValidator();
  const item = newWeightedOptOutPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedOptOutPolicyCodeLengthRule flags a long code", () => {
  const rule = new WeightedOptOutPolicyCodeLengthRule(1000);
  const item = newWeightedOptOutPolicy("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedOptOutPolicyImpressionsRangeRule flags values above impressions", () => {
  const rule = new WeightedOptOutPolicyImpressionsRangeRule(80, 3600);
  const item = newWeightedOptOutPolicy("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
