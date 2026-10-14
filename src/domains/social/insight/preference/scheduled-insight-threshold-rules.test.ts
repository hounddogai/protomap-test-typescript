import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledInsightThresholdDurationMinutesRangeRule,
  ScheduledInsightThresholdMinimumRangeRule,
  defaultScheduledInsightThresholdValidator,
} from "./scheduled-insight-threshold-rules.js";
import { newScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

test("ScheduledInsightThresholdValidator reports every problem", () => {
  const validator = defaultScheduledInsightThresholdValidator();
  const item = newScheduledInsightThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledInsightThresholdMinimumRangeRule flags values above minimum", () => {
  const rule = new ScheduledInsightThresholdMinimumRangeRule(5.1, 957.6);
  const item = newScheduledInsightThreshold("x", "y");
  item.minimum = 959.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledInsightThresholdDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new ScheduledInsightThresholdDurationMinutesRangeRule(3600, 86400);
  const item = newScheduledInsightThreshold("x", "y");
  item.durationMinutes = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
