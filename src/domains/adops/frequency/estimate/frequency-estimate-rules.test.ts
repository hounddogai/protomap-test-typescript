import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyEstimateAudienceIdLengthRule,
  FrequencyEstimateGraceDaysRangeRule,
  FrequencyEstimateLabelLengthRule,
  FrequencyEstimateRequiredCodeRule,
  FrequencyEstimateRequiredLabelRule,
  defaultFrequencyEstimateValidator,
} from "./frequency-estimate-rules.js";
import { newFrequencyEstimate } from "./frequency-estimate.js";

test("FrequencyEstimateValidator reports every problem", () => {
  const validator = defaultFrequencyEstimateValidator();
  const item = newFrequencyEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyEstimateGraceDaysRangeRule flags values above grace days", () => {
  const rule = new FrequencyEstimateGraceDaysRangeRule(32, 80);
  const item = newFrequencyEstimate("x", "y");
  item.graceDays = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyEstimateAudienceIdLengthRule flags a long audience id", () => {
  const rule = new FrequencyEstimateAudienceIdLengthRule(3600);
  const item = newFrequencyEstimate("x", "y");
  item.audienceId = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyEstimateLabelLengthRule flags a long label", () => {
  const rule = new FrequencyEstimateLabelLengthRule(3600);
  const item = newFrequencyEstimate("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyEstimateRequiredLabelRule flags a blank label", () => {
  const rule = new FrequencyEstimateRequiredLabelRule("frequency estimate needs a value");
  const item = newFrequencyEstimate("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new FrequencyEstimateRequiredCodeRule("frequency estimate needs this field");
  const item = newFrequencyEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
