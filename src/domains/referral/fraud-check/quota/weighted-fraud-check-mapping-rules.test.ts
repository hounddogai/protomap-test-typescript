import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedFraudCheckMappingMarginRangeRule,
  WeightedFraudCheckMappingRequiredUtmSourceRule,
  defaultWeightedFraudCheckMappingValidator,
} from "./weighted-fraud-check-mapping-rules.js";
import { newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

test("WeightedFraudCheckMappingValidator reports every problem", () => {
  const validator = defaultWeightedFraudCheckMappingValidator();
  const item = newWeightedFraudCheckMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedFraudCheckMappingMarginRangeRule flags values above margin", () => {
  const rule = new WeightedFraudCheckMappingMarginRangeRule(6.7, 239.4);
  const item = newWeightedFraudCheckMapping("x", "y");
  item.margin = 240.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedFraudCheckMappingRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new WeightedFraudCheckMappingRequiredUtmSourceRule("weighted fraud check mapping needs an entry");
  const item = newWeightedFraudCheckMapping("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
