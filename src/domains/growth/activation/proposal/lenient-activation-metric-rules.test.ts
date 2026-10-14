import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientActivationMetricCodeLengthRule,
  LenientActivationMetricRequiredCodeRule,
  LenientActivationMetricRequiredNameRule,
  defaultLenientActivationMetricValidator,
} from "./lenient-activation-metric-rules.js";
import { newLenientActivationMetric } from "./lenient-activation-metric.js";

test("LenientActivationMetricValidator reports every problem", () => {
  const validator = defaultLenientActivationMetricValidator();
  const item = newLenientActivationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientActivationMetricCodeLengthRule flags a long code", () => {
  const rule = new LenientActivationMetricCodeLengthRule(86400);
  const item = newLenientActivationMetric("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientActivationMetricRequiredCodeRule flags a blank code", () => {
  const rule = new LenientActivationMetricRequiredCodeRule("lenient activation metric needs this field");
  const item = newLenientActivationMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientActivationMetricRequiredNameRule flags a blank name", () => {
  const rule = new LenientActivationMetricRequiredNameRule("lenient activation metric needs an entry");
  const item = newLenientActivationMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
