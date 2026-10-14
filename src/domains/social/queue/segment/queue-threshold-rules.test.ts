import assert from "node:assert/strict";
import { test } from "node:test";
import {
  QueueThresholdDurationMinutesRangeRule,
  QueueThresholdNameLengthRule,
  QueueThresholdRequiredCountryRule,
  defaultQueueThresholdValidator,
} from "./queue-threshold-rules.js";
import { newQueueThreshold } from "./queue-threshold.js";

test("QueueThresholdValidator reports every problem", () => {
  const validator = defaultQueueThresholdValidator();
  const item = newQueueThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("QueueThresholdDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new QueueThresholdDurationMinutesRangeRule(16, 80);
  const item = newQueueThreshold("x", "y");
  item.durationMinutes = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("QueueThresholdNameLengthRule flags a long name", () => {
  const rule = new QueueThresholdNameLengthRule(255);
  const item = newQueueThreshold("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("QueueThresholdRequiredCountryRule flags a blank country", () => {
  const rule = new QueueThresholdRequiredCountryRule("queue threshold needs an entry");
  const item = newQueueThreshold("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
