import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackFunnelThresholdCodeLengthRule,
  FallbackFunnelThresholdTitleLengthRule,
  defaultFallbackFunnelThresholdValidator,
} from "./fallback-funnel-threshold-rules.js";
import { newFallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

test("FallbackFunnelThresholdValidator reports every problem", () => {
  const validator = defaultFallbackFunnelThresholdValidator();
  const item = newFallbackFunnelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackFunnelThresholdCodeLengthRule flags a long code", () => {
  const rule = new FallbackFunnelThresholdCodeLengthRule(3600);
  const item = newFallbackFunnelThreshold("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackFunnelThresholdTitleLengthRule flags a long title", () => {
  const rule = new FallbackFunnelThresholdTitleLengthRule(80);
  const item = newFallbackFunnelThreshold("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
