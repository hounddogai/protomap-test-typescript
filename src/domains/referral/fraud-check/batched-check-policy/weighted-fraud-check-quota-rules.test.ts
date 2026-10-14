import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFraudCheckQuotaCodeLengthRule,
  WeightedFraudCheckQuotaConversionRateRangeRule,
  WeightedFraudCheckQuotaLabelLengthRule,
  WeightedFraudCheckQuotaTitleLengthRule,
  defaultWeightedFraudCheckQuotaValidator,
} from "./weighted-fraud-check-quota-rules.js";
import { newWeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

test("WeightedFraudCheckQuotaValidator reports every problem", () => {
  const validator = defaultWeightedFraudCheckQuotaValidator();
  const item = newWeightedFraudCheckQuota("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFraudCheckQuotaConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new WeightedFraudCheckQuotaConversionRateRangeRule(9.1, 2141);
  const item = newWeightedFraudCheckQuota("x", "y");
  item.conversionRate = 2142.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedFraudCheckQuotaLabelLengthRule flags a long label", () => {
  const rule = new WeightedFraudCheckQuotaLabelLengthRule(64);
  const item = newWeightedFraudCheckQuota("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFraudCheckQuotaTitleLengthRule flags a long title", () => {
  const rule = new WeightedFraudCheckQuotaTitleLengthRule(80);
  const item = newWeightedFraudCheckQuota("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedFraudCheckQuotaCodeLengthRule flags a long code", () => {
  const rule = new WeightedFraudCheckQuotaCodeLengthRule(1000);
  const item = newWeightedFraudCheckQuota("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
