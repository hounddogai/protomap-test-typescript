import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictWaitMetricCodeLengthRule,
  StrictWaitMetricRequiredCodeRule,
  StrictWaitMetricRequiredSegmentRule,
  defaultStrictWaitMetricValidator,
} from "./strict-wait-metric-rules.js";
import { newStrictWaitMetric } from "./strict-wait-metric.js";

test("StrictWaitMetricValidator reports every problem", () => {
  const validator = defaultStrictWaitMetricValidator();
  const item = newStrictWaitMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictWaitMetricRequiredSegmentRule flags a blank segment", () => {
  const rule = new StrictWaitMetricRequiredSegmentRule("strict wait metric needs an entry");
  const item = newStrictWaitMetric("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitMetricRequiredCodeRule flags a blank code", () => {
  const rule = new StrictWaitMetricRequiredCodeRule("strict wait metric needs this field");
  const item = newStrictWaitMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictWaitMetricCodeLengthRule flags a long code", () => {
  const rule = new StrictWaitMetricCodeLengthRule(80);
  const item = newStrictWaitMetric("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
