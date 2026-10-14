import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultSuppressionEstimateDurationMinutesRangeRule,
  DefaultSuppressionEstimateImpressionsRangeRule,
  DefaultSuppressionEstimateTitleLengthRule,
  defaultDefaultSuppressionEstimateValidator,
} from "./default-suppression-estimate-rules.js";
import { newDefaultSuppressionEstimate } from "./default-suppression-estimate.js";

test("DefaultSuppressionEstimateValidator reports every problem", () => {
  const validator = defaultDefaultSuppressionEstimateValidator();
  const item = newDefaultSuppressionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultSuppressionEstimateTitleLengthRule flags a long title", () => {
  const rule = new DefaultSuppressionEstimateTitleLengthRule(86400);
  const item = newDefaultSuppressionEstimate("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultSuppressionEstimateImpressionsRangeRule flags values above impressions", () => {
  const rule = new DefaultSuppressionEstimateImpressionsRangeRule(255, 3600);
  const item = newDefaultSuppressionEstimate("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultSuppressionEstimateDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new DefaultSuppressionEstimateDurationMinutesRangeRule(16, 32);
  const item = newDefaultSuppressionEstimate("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
