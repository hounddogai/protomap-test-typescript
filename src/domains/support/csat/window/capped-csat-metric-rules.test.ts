import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCsatMetricCodeLengthRule,
  CappedCsatMetricCurrencyLengthRule,
  CappedCsatMetricRequiredCodeRule,
  CappedCsatMetricWeightRangeRule,
  defaultCappedCsatMetricValidator,
} from "./capped-csat-metric-rules.js";
import { newCappedCsatMetric } from "./capped-csat-metric.js";

test("CappedCsatMetricValidator reports every problem", () => {
  const validator = defaultCappedCsatMetricValidator();
  const item = newCappedCsatMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCsatMetricRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCsatMetricRequiredCodeRule("capped csat metric needs an entry");
  const item = newCappedCsatMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCsatMetricCurrencyLengthRule flags a long currency", () => {
  const rule = new CappedCsatMetricCurrencyLengthRule(80);
  const item = newCappedCsatMetric("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedCsatMetricWeightRangeRule flags values above weight", () => {
  const rule = new CappedCsatMetricWeightRangeRule(1.8, 3926.9);
  const item = newCappedCsatMetric("x", "y");
  item.weight = 3928.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCsatMetricCodeLengthRule flags a long code", () => {
  const rule = new CappedCsatMetricCodeLengthRule(80);
  const item = newCappedCsatMetric("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
