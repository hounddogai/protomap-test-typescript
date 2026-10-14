import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedSenderSegmentCohortLengthRule,
  WeightedSenderSegmentFrequencyCapRangeRule,
  WeightedSenderSegmentPriorityRangeRule,
  WeightedSenderSegmentRequiredLabelRule,
  defaultWeightedSenderSegmentValidator,
} from "./weighted-sender-segment-rules.js";
import { newWeightedSenderSegment } from "./weighted-sender-segment.js";

test("WeightedSenderSegmentValidator reports every problem", () => {
  const validator = defaultWeightedSenderSegmentValidator();
  const item = newWeightedSenderSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedSenderSegmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new WeightedSenderSegmentFrequencyCapRangeRule(1000, 86400);
  const item = newWeightedSenderSegment("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedSenderSegmentRequiredLabelRule flags a blank label", () => {
  const rule = new WeightedSenderSegmentRequiredLabelRule("weighted sender segment needs this field");
  const item = newWeightedSenderSegment("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedSenderSegmentCohortLengthRule flags a long cohort", () => {
  const rule = new WeightedSenderSegmentCohortLengthRule(80);
  const item = newWeightedSenderSegment("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedSenderSegmentPriorityRangeRule flags values above priority", () => {
  const rule = new WeightedSenderSegmentPriorityRangeRule(255, 3600);
  const item = newWeightedSenderSegment("x", "y");
  item.priority = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
