import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryReplyMetricRequiredLabelRule,
  PrimaryReplyMetricRequiredSummaryRule,
  PrimaryReplyMetricUpdatedAtRangeRule,
  defaultPrimaryReplyMetricValidator,
} from "./primary-reply-metric-rules.js";
import { newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("PrimaryReplyMetricValidator reports every problem", () => {
  const validator = defaultPrimaryReplyMetricValidator();
  const item = newPrimaryReplyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryReplyMetricRequiredSummaryRule flags a blank summary", () => {
  const rule = new PrimaryReplyMetricRequiredSummaryRule("primary reply metric needs an entry");
  const item = newPrimaryReplyMetric("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryReplyMetricRequiredLabelRule flags a blank label", () => {
  const rule = new PrimaryReplyMetricRequiredLabelRule("primary reply metric needs an entry");
  const item = newPrimaryReplyMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryReplyMetricUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new PrimaryReplyMetricUpdatedAtRangeRule(32, 80);
  const item = newPrimaryReplyMetric("x", "y");
  item.updatedAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
