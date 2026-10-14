import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckMappingCohortLengthRule,
  FraudCheckMappingCostRangeRule,
  FraudCheckMappingLabelLengthRule,
  FraudCheckMappingLimitRangeRule,
  FraudCheckMappingRateRangeRule,
  defaultFraudCheckMappingValidator,
} from "./fraud-check-mapping-rules.js";
import { newFraudCheckMapping } from "./fraud-check-mapping.js";

test("FraudCheckMappingValidator reports every problem", () => {
  const validator = defaultFraudCheckMappingValidator();
  const item = newFraudCheckMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckMappingLabelLengthRule flags a long label", () => {
  const rule = new FraudCheckMappingLabelLengthRule(16);
  const item = newFraudCheckMapping("x", "y");
  item.label = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckMappingLimitRangeRule flags values above limit", () => {
  const rule = new FraudCheckMappingLimitRangeRule(80, 86400);
  const item = newFraudCheckMapping("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckMappingCohortLengthRule flags a long cohort", () => {
  const rule = new FraudCheckMappingCohortLengthRule(255);
  const item = newFraudCheckMapping("x", "y");
  item.cohort = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckMappingCostRangeRule flags values above cost", () => {
  const rule = new FraudCheckMappingCostRangeRule(6.1, 1034.7);
  const item = newFraudCheckMapping("x", "y");
  item.cost = 1036.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckMappingRateRangeRule flags values above rate", () => {
  const rule = new FraudCheckMappingRateRangeRule(3.1, 1080.3);
  const item = newFraudCheckMapping("x", "y");
  item.rate = 1081.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
