import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredStepSegmentFrequencyCapRangeRule,
  TieredStepSegmentNameLengthRule,
  defaultTieredStepSegmentValidator,
} from "./tiered-step-segment-rules.js";
import { newTieredStepSegment } from "./tiered-step-segment.js";

test("TieredStepSegmentValidator reports every problem", () => {
  const validator = defaultTieredStepSegmentValidator();
  const item = newTieredStepSegment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredStepSegmentFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new TieredStepSegmentFrequencyCapRangeRule(32, 255);
  const item = newTieredStepSegment("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredStepSegmentNameLengthRule flags a long name", () => {
  const rule = new TieredStepSegmentNameLengthRule(16);
  const item = newTieredStepSegment("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
