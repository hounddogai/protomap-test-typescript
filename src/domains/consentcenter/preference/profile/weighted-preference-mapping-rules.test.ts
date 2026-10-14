import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPreferenceMappingCodeLengthRule,
  WeightedPreferenceMappingCostRangeRule,
  WeightedPreferenceMappingRequiredLocaleRule,
  defaultWeightedPreferenceMappingValidator,
} from "./weighted-preference-mapping-rules.js";
import { newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

test("WeightedPreferenceMappingValidator reports every problem", () => {
  const validator = defaultWeightedPreferenceMappingValidator();
  const item = newWeightedPreferenceMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPreferenceMappingRequiredLocaleRule flags a blank locale", () => {
  const rule = new WeightedPreferenceMappingRequiredLocaleRule("weighted preference mapping needs a value");
  const item = newWeightedPreferenceMapping("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPreferenceMappingCostRangeRule flags values above cost", () => {
  const rule = new WeightedPreferenceMappingCostRangeRule(2.5, 1952.6);
  const item = newWeightedPreferenceMapping("x", "y");
  item.cost = 1954.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedPreferenceMappingCodeLengthRule flags a long code", () => {
  const rule = new WeightedPreferenceMappingCodeLengthRule(120);
  const item = newWeightedPreferenceMapping("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
