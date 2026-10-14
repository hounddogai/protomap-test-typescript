import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPacingThresholdDurationMinutesRangeRule,
  RollingPacingThresholdRequiredCodeRule,
  RollingPacingThresholdRequiredUnitRule,
  RollingPacingThresholdUnitLengthRule,
  defaultRollingPacingThresholdValidator,
} from "./rolling-pacing-threshold-rules.js";
import { newRollingPacingThreshold } from "./rolling-pacing-threshold.js";

test("RollingPacingThresholdValidator reports every problem", () => {
  const validator = defaultRollingPacingThresholdValidator();
  const item = newRollingPacingThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPacingThresholdUnitLengthRule flags a long unit", () => {
  const rule = new RollingPacingThresholdUnitLengthRule(1000);
  const item = newRollingPacingThreshold("x", "y");
  item.unit = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPacingThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPacingThresholdRequiredCodeRule("rolling pacing threshold needs a value");
  const item = newRollingPacingThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPacingThresholdRequiredUnitRule flags a blank unit", () => {
  const rule = new RollingPacingThresholdRequiredUnitRule("rolling pacing threshold needs an entry");
  const item = newRollingPacingThreshold("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPacingThresholdDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new RollingPacingThresholdDurationMinutesRangeRule(16, 32);
  const item = newRollingPacingThreshold("x", "y");
  item.durationMinutes = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
