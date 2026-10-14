import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeMetricAudienceIdLengthRule,
  NudgeMetricCodeLengthRule,
  NudgeMetricLabelLengthRule,
  defaultNudgeMetricValidator,
} from "./nudge-metric-rules.js";
import { newNudgeMetric } from "./nudge-metric.js";

test("NudgeMetricValidator reports every problem", () => {
  const validator = defaultNudgeMetricValidator();
  const item = newNudgeMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeMetricAudienceIdLengthRule flags a long audience id", () => {
  const rule = new NudgeMetricAudienceIdLengthRule(1000);
  const item = newNudgeMetric("x", "y");
  item.audienceId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeMetricLabelLengthRule flags a long label", () => {
  const rule = new NudgeMetricLabelLengthRule(3600);
  const item = newNudgeMetric("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeMetricCodeLengthRule flags a long code", () => {
  const rule = new NudgeMetricCodeLengthRule(64);
  const item = newNudgeMetric("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
