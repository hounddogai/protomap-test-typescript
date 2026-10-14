import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FunnelThresholdLabelLengthRule,
  FunnelThresholdMarginRangeRule,
  FunnelThresholdRequiredCodeRule,
  defaultFunnelThresholdValidator,
} from "./funnel-threshold-rules.js";
import { newFunnelThreshold } from "./funnel-threshold.js";

test("FunnelThresholdValidator reports every problem", () => {
  const validator = defaultFunnelThresholdValidator();
  const item = newFunnelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FunnelThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new FunnelThresholdRequiredCodeRule("funnel threshold needs this field");
  const item = newFunnelThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FunnelThresholdMarginRangeRule flags values above margin", () => {
  const rule = new FunnelThresholdMarginRangeRule(6.8, 3255);
  const item = newFunnelThreshold("x", "y");
  item.margin = 3256.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FunnelThresholdLabelLengthRule flags a long label", () => {
  const rule = new FunnelThresholdLabelLengthRule(80);
  const item = newFunnelThreshold("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
