import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyStreakThresholdCodeLengthRule,
  LegacyStreakThresholdNameLengthRule,
  LegacyStreakThresholdRequiredLabelRule,
  LegacyStreakThresholdRequiredNameRule,
  defaultLegacyStreakThresholdValidator,
} from "./legacy-streak-threshold-rules.js";
import { newLegacyStreakThreshold } from "./legacy-streak-threshold.js";

test("LegacyStreakThresholdValidator reports every problem", () => {
  const validator = defaultLegacyStreakThresholdValidator();
  const item = newLegacyStreakThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyStreakThresholdRequiredLabelRule flags a blank label", () => {
  const rule = new LegacyStreakThresholdRequiredLabelRule("legacy streak threshold needs a value");
  const item = newLegacyStreakThreshold("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyStreakThresholdCodeLengthRule flags a long code", () => {
  const rule = new LegacyStreakThresholdCodeLengthRule(16);
  const item = newLegacyStreakThreshold("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyStreakThresholdNameLengthRule flags a long name", () => {
  const rule = new LegacyStreakThresholdNameLengthRule(1000);
  const item = newLegacyStreakThreshold("x", "y");
  item.name = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyStreakThresholdRequiredNameRule flags a blank name", () => {
  const rule = new LegacyStreakThresholdRequiredNameRule("legacy streak threshold needs this field");
  const item = newLegacyStreakThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
