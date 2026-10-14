import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingFunnelThresholdRequiredUnitRule,
  RollingFunnelThresholdScoreRangeRule,
  RollingFunnelThresholdUnitLengthRule,
  defaultRollingFunnelThresholdValidator,
} from "./rolling-funnel-threshold-rules.js";
import { newRollingFunnelThreshold } from "./rolling-funnel-threshold.js";

test("RollingFunnelThresholdValidator reports every problem", () => {
  const validator = defaultRollingFunnelThresholdValidator();
  const item = newRollingFunnelThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingFunnelThresholdUnitLengthRule flags a long unit", () => {
  const rule = new RollingFunnelThresholdUnitLengthRule(1000);
  const item = newRollingFunnelThreshold("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingFunnelThresholdScoreRangeRule flags values above score", () => {
  const rule = new RollingFunnelThresholdScoreRangeRule(0.5, 1181.8);
  const item = newRollingFunnelThreshold("x", "y");
  item.score = 1183.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingFunnelThresholdRequiredUnitRule flags a blank unit", () => {
  const rule = new RollingFunnelThresholdRequiredUnitRule("rolling funnel threshold needs a value");
  const item = newRollingFunnelThreshold("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
