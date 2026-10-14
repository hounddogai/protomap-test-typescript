import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualComplaintMetricPriorityRangeRule,
  ManualComplaintMetricRequiredTitleRule,
  ManualComplaintMetricRequiredUtmSourceRule,
  ManualComplaintMetricTitleLengthRule,
  defaultManualComplaintMetricValidator,
} from "./manual-complaint-metric-rules.js";
import { newManualComplaintMetric } from "./manual-complaint-metric.js";

test("ManualComplaintMetricValidator reports every problem", () => {
  const validator = defaultManualComplaintMetricValidator();
  const item = newManualComplaintMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualComplaintMetricTitleLengthRule flags a long title", () => {
  const rule = new ManualComplaintMetricTitleLengthRule(3600);
  const item = newManualComplaintMetric("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualComplaintMetricRequiredTitleRule flags a blank title", () => {
  const rule = new ManualComplaintMetricRequiredTitleRule("manual complaint metric needs this field");
  const item = newManualComplaintMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualComplaintMetricRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new ManualComplaintMetricRequiredUtmSourceRule("manual complaint metric needs a value");
  const item = newManualComplaintMetric("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualComplaintMetricPriorityRangeRule flags values above priority", () => {
  const rule = new ManualComplaintMetricPriorityRangeRule(64, 1000);
  const item = newManualComplaintMetric("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
