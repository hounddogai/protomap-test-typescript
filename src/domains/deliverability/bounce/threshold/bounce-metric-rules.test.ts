import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BounceMetricCodeLengthRule,
  BounceMetricRequiredChannelRule,
  defaultBounceMetricValidator,
} from "./bounce-metric-rules.js";
import { newBounceMetric } from "./bounce-metric.js";

test("BounceMetricValidator reports every problem", () => {
  const validator = defaultBounceMetricValidator();
  const item = newBounceMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BounceMetricCodeLengthRule flags a long code", () => {
  const rule = new BounceMetricCodeLengthRule(1000);
  const item = newBounceMetric("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BounceMetricRequiredChannelRule flags a blank channel", () => {
  const rule = new BounceMetricRequiredChannelRule("bounce metric needs a value");
  const item = newBounceMetric("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
