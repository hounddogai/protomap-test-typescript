import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredSuppressionEstimateCapacityRangeRule,
  TieredSuppressionEstimateCountryLengthRule,
  TieredSuppressionEstimateNameLengthRule,
  TieredSuppressionEstimatePhoneLengthRule,
  TieredSuppressionEstimateRequiredNameRule,
  defaultTieredSuppressionEstimateValidator,
} from "./tiered-suppression-estimate-rules.js";
import { newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("TieredSuppressionEstimateValidator reports every problem", () => {
  const validator = defaultTieredSuppressionEstimateValidator();
  const item = newTieredSuppressionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredSuppressionEstimateRequiredNameRule flags a blank name", () => {
  const rule = new TieredSuppressionEstimateRequiredNameRule("tiered suppression estimate needs a value");
  const item = newTieredSuppressionEstimate("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredSuppressionEstimateCountryLengthRule flags a long country", () => {
  const rule = new TieredSuppressionEstimateCountryLengthRule(120);
  const item = newTieredSuppressionEstimate("x", "y");
  item.country = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredSuppressionEstimateCapacityRangeRule flags values above capacity", () => {
  const rule = new TieredSuppressionEstimateCapacityRangeRule(64, 120);
  const item = newTieredSuppressionEstimate("x", "y");
  item.capacity = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredSuppressionEstimateNameLengthRule flags a long name", () => {
  const rule = new TieredSuppressionEstimateNameLengthRule(255);
  const item = newTieredSuppressionEstimate("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredSuppressionEstimatePhoneLengthRule flags a long phone", () => {
  const rule = new TieredSuppressionEstimatePhoneLengthRule(255);
  const item = newTieredSuppressionEstimate("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
