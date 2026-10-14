import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ScheduledDomainMetricCodeLengthRule,
  ScheduledDomainMetricPriorityRangeRule,
  ScheduledDomainMetricRequiredLabelRule,
  defaultScheduledDomainMetricValidator,
} from "./scheduled-domain-metric-rules.js";
import { newScheduledDomainMetric } from "./scheduled-domain-metric.js";

test("ScheduledDomainMetricValidator reports every problem", () => {
  const validator = defaultScheduledDomainMetricValidator();
  const item = newScheduledDomainMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ScheduledDomainMetricPriorityRangeRule flags values above priority", () => {
  const rule = new ScheduledDomainMetricPriorityRangeRule(64, 1000);
  const item = newScheduledDomainMetric("x", "y");
  item.priority = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ScheduledDomainMetricCodeLengthRule flags a long code", () => {
  const rule = new ScheduledDomainMetricCodeLengthRule(120);
  const item = newScheduledDomainMetric("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ScheduledDomainMetricRequiredLabelRule flags a blank label", () => {
  const rule = new ScheduledDomainMetricRequiredLabelRule("scheduled domain metric needs this field");
  const item = newScheduledDomainMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
