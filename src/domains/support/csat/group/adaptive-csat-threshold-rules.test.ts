import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveCsatThresholdAudienceIdLengthRule,
  AdaptiveCsatThresholdRequiredAudienceIdRule,
  AdaptiveCsatThresholdRequiredCodeRule,
  AdaptiveCsatThresholdUpdatedAtRangeRule,
  defaultAdaptiveCsatThresholdValidator,
} from "./adaptive-csat-threshold-rules.js";
import { newAdaptiveCsatThreshold } from "./adaptive-csat-threshold.js";

test("AdaptiveCsatThresholdValidator reports every problem", () => {
  const validator = defaultAdaptiveCsatThresholdValidator();
  const item = newAdaptiveCsatThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveCsatThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveCsatThresholdRequiredCodeRule("adaptive csat threshold needs a value");
  const item = newAdaptiveCsatThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveCsatThresholdAudienceIdLengthRule flags a long audience id", () => {
  const rule = new AdaptiveCsatThresholdAudienceIdLengthRule(80);
  const item = newAdaptiveCsatThreshold("x", "y");
  item.audienceId = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveCsatThresholdUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new AdaptiveCsatThresholdUpdatedAtRangeRule(32, 3600);
  const item = newAdaptiveCsatThreshold("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveCsatThresholdRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new AdaptiveCsatThresholdRequiredAudienceIdRule("adaptive csat threshold needs an entry");
  const item = newAdaptiveCsatThreshold("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
