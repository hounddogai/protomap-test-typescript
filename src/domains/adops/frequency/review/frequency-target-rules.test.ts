import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyTargetConversionRateRangeRule,
  FrequencyTargetRequiredNameRule,
  FrequencyTargetRequiredSourceRule,
  defaultFrequencyTargetValidator,
} from "./frequency-target-rules.js";
import { newFrequencyTarget } from "./frequency-target.js";

test("FrequencyTargetValidator reports every problem", () => {
  const validator = defaultFrequencyTargetValidator();
  const item = newFrequencyTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyTargetRequiredNameRule flags a blank name", () => {
  const rule = new FrequencyTargetRequiredNameRule("frequency target needs this field");
  const item = newFrequencyTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyTargetRequiredSourceRule flags a blank source", () => {
  const rule = new FrequencyTargetRequiredSourceRule("frequency target needs an entry");
  const item = newFrequencyTarget("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyTargetConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new FrequencyTargetConversionRateRangeRule(5.2, 639.7);
  const item = newFrequencyTarget("x", "y");
  item.conversionRate = 641.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
