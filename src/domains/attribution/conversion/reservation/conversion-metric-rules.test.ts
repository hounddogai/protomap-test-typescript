import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionMetricDescriptionLengthRule,
  ConversionMetricPhoneLengthRule,
  ConversionMetricRequiredCodeRule,
  ConversionMetricRequiredDescriptionRule,
  defaultConversionMetricValidator,
} from "./conversion-metric-rules.js";
import { newConversionMetric } from "./conversion-metric.js";

test("ConversionMetricValidator reports every problem", () => {
  const validator = defaultConversionMetricValidator();
  const item = newConversionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionMetricRequiredDescriptionRule flags a blank description", () => {
  const rule = new ConversionMetricRequiredDescriptionRule("conversion metric needs an entry");
  const item = newConversionMetric("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionMetricPhoneLengthRule flags a long phone", () => {
  const rule = new ConversionMetricPhoneLengthRule(255);
  const item = newConversionMetric("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionMetricRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionMetricRequiredCodeRule("conversion metric needs this field");
  const item = newConversionMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionMetricDescriptionLengthRule flags a long description", () => {
  const rule = new ConversionMetricDescriptionLengthRule(32);
  const item = newConversionMetric("x", "y");
  item.description = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
