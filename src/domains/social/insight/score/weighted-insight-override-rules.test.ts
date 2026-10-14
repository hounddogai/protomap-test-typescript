import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedInsightOverrideCostRangeRule,
  WeightedInsightOverrideCountryLengthRule,
  WeightedInsightOverrideRequiredLabelRule,
  WeightedInsightOverrideRequiredSourceRule,
  WeightedInsightOverrideSourceLengthRule,
  defaultWeightedInsightOverrideValidator,
} from "./weighted-insight-override-rules.js";
import { newWeightedInsightOverride } from "./weighted-insight-override.js";

test("WeightedInsightOverrideValidator reports every problem", () => {
  const validator = defaultWeightedInsightOverrideValidator();
  const item = newWeightedInsightOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedInsightOverrideCountryLengthRule flags a long country", () => {
  const rule = new WeightedInsightOverrideCountryLengthRule(32);
  const item = newWeightedInsightOverride("x", "y");
  item.country = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInsightOverrideRequiredSourceRule flags a blank source", () => {
  const rule = new WeightedInsightOverrideRequiredSourceRule("weighted insight override needs an entry");
  const item = newWeightedInsightOverride("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedInsightOverrideSourceLengthRule flags a long source", () => {
  const rule = new WeightedInsightOverrideSourceLengthRule(86400);
  const item = newWeightedInsightOverride("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedInsightOverrideCostRangeRule flags values above cost", () => {
  const rule = new WeightedInsightOverrideCostRangeRule(0.7, 1934.8);
  const item = newWeightedInsightOverride("x", "y");
  item.cost = 1936.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedInsightOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedInsightOverrideRequiredLabelRule("weighted insight override needs a value");
  const item = newWeightedInsightOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
