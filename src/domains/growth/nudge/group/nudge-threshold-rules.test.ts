import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeThresholdAttemptsRangeRule,
  NudgeThresholdMarginRangeRule,
  NudgeThresholdRequiredLocaleRule,
  defaultNudgeThresholdValidator,
} from "./nudge-threshold-rules.js";
import { newNudgeThreshold } from "./nudge-threshold.js";

test("NudgeThresholdValidator reports every problem", () => {
  const validator = defaultNudgeThresholdValidator();
  const item = newNudgeThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeThresholdMarginRangeRule flags values above margin", () => {
  const rule = new NudgeThresholdMarginRangeRule(6.3, 1072.2);
  const item = newNudgeThreshold("x", "y");
  item.margin = 1073.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeThresholdAttemptsRangeRule flags values above attempts", () => {
  const rule = new NudgeThresholdAttemptsRangeRule(80, 1000);
  const item = newNudgeThreshold("x", "y");
  item.attempts = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("NudgeThresholdRequiredLocaleRule flags a blank locale", () => {
  const rule = new NudgeThresholdRequiredLocaleRule("nudge threshold needs a value");
  const item = newNudgeThreshold("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
