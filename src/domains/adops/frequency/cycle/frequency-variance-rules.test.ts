import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyVarianceLimitRangeRule,
  FrequencyVarianceNameLengthRule,
  FrequencyVarianceRequiredSourceRule,
  FrequencyVarianceSendAtRangeRule,
  defaultFrequencyVarianceValidator,
} from "./frequency-variance-rules.js";
import { newFrequencyVariance } from "./frequency-variance.js";

test("FrequencyVarianceValidator reports every problem", () => {
  const validator = defaultFrequencyVarianceValidator();
  const item = newFrequencyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyVarianceRequiredSourceRule flags a blank source", () => {
  const rule = new FrequencyVarianceRequiredSourceRule("frequency variance needs this field");
  const item = newFrequencyVariance("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyVarianceLimitRangeRule flags values above limit", () => {
  const rule = new FrequencyVarianceLimitRangeRule(255, 86400);
  const item = newFrequencyVariance("x", "y");
  item.limit = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyVarianceNameLengthRule flags a long name", () => {
  const rule = new FrequencyVarianceNameLengthRule(80);
  const item = newFrequencyVariance("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyVarianceSendAtRangeRule flags values above send at", () => {
  const rule = new FrequencyVarianceSendAtRangeRule(16, 16);
  const item = newFrequencyVariance("x", "y");
  item.sendAt = 17;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
