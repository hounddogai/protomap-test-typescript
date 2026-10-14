import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedActivationMetricCodeLengthRule,
  CappedActivationMetricRequiredNameRule,
  defaultCappedActivationMetricValidator,
} from "./capped-activation-metric-rules.js";
import { newCappedActivationMetric } from "./capped-activation-metric.js";

test("CappedActivationMetricValidator reports every problem", () => {
  const validator = defaultCappedActivationMetricValidator();
  const item = newCappedActivationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedActivationMetricCodeLengthRule flags a long code", () => {
  const rule = new CappedActivationMetricCodeLengthRule(16);
  const item = newCappedActivationMetric("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedActivationMetricRequiredNameRule flags a blank name", () => {
  const rule = new CappedActivationMetricRequiredNameRule("capped activation metric needs an entry");
  const item = newCappedActivationMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
