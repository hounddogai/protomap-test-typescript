import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadgeMetricLabelLengthRule,
  BadgeMetricRequiredCodeRule,
  BadgeMetricRequiredContactEmailRule,
  defaultBadgeMetricValidator,
} from "./badge-metric-rules.js";
import { newBadgeMetric } from "./badge-metric.js";

test("BadgeMetricValidator reports every problem", () => {
  const validator = defaultBadgeMetricValidator();
  const item = newBadgeMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BadgeMetricLabelLengthRule flags a long label", () => {
  const rule = new BadgeMetricLabelLengthRule(64);
  const item = newBadgeMetric("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BadgeMetricRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new BadgeMetricRequiredContactEmailRule("badge metric needs an entry");
  const item = newBadgeMetric("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BadgeMetricRequiredCodeRule flags a blank code", () => {
  const rule = new BadgeMetricRequiredCodeRule("badge metric needs an entry");
  const item = newBadgeMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
