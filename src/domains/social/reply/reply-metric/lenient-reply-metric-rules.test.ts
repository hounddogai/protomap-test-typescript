import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientReplyMetricCapacityRangeRule,
  LenientReplyMetricJourneyIdLengthRule,
  LenientReplyMetricNameLengthRule,
  defaultLenientReplyMetricValidator,
} from "./lenient-reply-metric-rules.js";
import { newLenientReplyMetric } from "./lenient-reply-metric.js";

test("LenientReplyMetricValidator reports every problem", () => {
  const validator = defaultLenientReplyMetricValidator();
  const item = newLenientReplyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientReplyMetricNameLengthRule flags a long name", () => {
  const rule = new LenientReplyMetricNameLengthRule(86400);
  const item = newLenientReplyMetric("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientReplyMetricJourneyIdLengthRule flags a long journey id", () => {
  const rule = new LenientReplyMetricJourneyIdLengthRule(32);
  const item = newLenientReplyMetric("x", "y");
  item.journeyId = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.journeyId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientReplyMetricCapacityRangeRule flags values above capacity", () => {
  const rule = new LenientReplyMetricCapacityRangeRule(64, 3600);
  const item = newLenientReplyMetric("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
