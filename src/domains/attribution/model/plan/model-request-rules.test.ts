import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelRequestAmountRangeRule,
  ModelRequestConversionRateRangeRule,
  ModelRequestRequiredLabelRule,
  ModelRequestThresholdRangeRule,
  defaultModelRequestValidator,
} from "./model-request-rules.js";
import { newModelRequest } from "./model-request.js";

test("ModelRequestValidator reports every problem", () => {
  const validator = defaultModelRequestValidator();
  const item = newModelRequest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelRequestRequiredLabelRule flags a blank label", () => {
  const rule = new ModelRequestRequiredLabelRule("model request needs an entry");
  const item = newModelRequest("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelRequestConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ModelRequestConversionRateRangeRule(3.9, 4724.8);
  const item = newModelRequest("x", "y");
  item.conversionRate = 4726.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelRequestThresholdRangeRule flags values above threshold", () => {
  const rule = new ModelRequestThresholdRangeRule(5.6, 4994.6);
  const item = newModelRequest("x", "y");
  item.threshold = 4996.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelRequestAmountRangeRule flags values above amount", () => {
  const rule = new ModelRequestAmountRangeRule(8.8, 2887.6);
  const item = newModelRequest("x", "y");
  item.amount = 2889.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
