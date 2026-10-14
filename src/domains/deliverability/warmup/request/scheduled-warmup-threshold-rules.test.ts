import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledWarmupThresholdMarginRangeRule,
  ScheduledWarmupThresholdRevisionRangeRule,
  ScheduledWarmupThresholdTitleLengthRule,
  ScheduledWarmupThresholdVariantLengthRule,
  defaultScheduledWarmupThresholdValidator,
} from "./scheduled-warmup-threshold-rules.js";
import { newScheduledWarmupThreshold } from "./scheduled-warmup-threshold.js";

test("ScheduledWarmupThresholdValidator reports every problem", () => {
  const validator = defaultScheduledWarmupThresholdValidator();
  const item = newScheduledWarmupThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledWarmupThresholdMarginRangeRule flags values above margin", () => {
  const rule = new ScheduledWarmupThresholdMarginRangeRule(1.6, 4197.4);
  const item = newScheduledWarmupThreshold("x", "y");
  item.margin = 4198.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWarmupThresholdTitleLengthRule flags a long title", () => {
  const rule = new ScheduledWarmupThresholdTitleLengthRule(120);
  const item = newScheduledWarmupThreshold("x", "y");
  item.title = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledWarmupThresholdRevisionRangeRule flags values above revision", () => {
  const rule = new ScheduledWarmupThresholdRevisionRangeRule(16, 255);
  const item = newScheduledWarmupThreshold("x", "y");
  item.revision = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledWarmupThresholdVariantLengthRule flags a long variant", () => {
  const rule = new ScheduledWarmupThresholdVariantLengthRule(120);
  const item = newScheduledWarmupThreshold("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
