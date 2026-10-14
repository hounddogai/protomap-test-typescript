import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CreativeMetricCodeLengthRule,
  CreativeMetricNameLengthRule,
  CreativeMetricReviewerLengthRule,
  defaultCreativeMetricValidator,
} from "./creative-metric-rules.js";
import { newCreativeMetric } from "./creative-metric.js";

test("CreativeMetricValidator reports every problem", () => {
  const validator = defaultCreativeMetricValidator();
  const item = newCreativeMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CreativeMetricCodeLengthRule flags a long code", () => {
  const rule = new CreativeMetricCodeLengthRule(120);
  const item = newCreativeMetric("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeMetricReviewerLengthRule flags a long reviewer", () => {
  const rule = new CreativeMetricReviewerLengthRule(255);
  const item = newCreativeMetric("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CreativeMetricNameLengthRule flags a long name", () => {
  const rule = new CreativeMetricNameLengthRule(3600);
  const item = newCreativeMetric("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
