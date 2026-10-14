import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledFunnelThresholdRequiredCodeRule,
  ScheduledFunnelThresholdTitleLengthRule,
  ScheduledFunnelThresholdVariantLengthRule,
  defaultScheduledFunnelThresholdValidator,
} from "./scheduled-funnel-threshold-rules.js";
import { newScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

test("ScheduledFunnelThresholdValidator reports every problem", () => {
  const validator = defaultScheduledFunnelThresholdValidator();
  const item = newScheduledFunnelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledFunnelThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new ScheduledFunnelThresholdRequiredCodeRule("scheduled funnel threshold needs this field");
  const item = newScheduledFunnelThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ScheduledFunnelThresholdTitleLengthRule flags a long title", () => {
  const rule = new ScheduledFunnelThresholdTitleLengthRule(64);
  const item = newScheduledFunnelThreshold("x", "y");
  item.title = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledFunnelThresholdVariantLengthRule flags a long variant", () => {
  const rule = new ScheduledFunnelThresholdVariantLengthRule(32);
  const item = newScheduledFunnelThreshold("x", "y");
  item.variant = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
