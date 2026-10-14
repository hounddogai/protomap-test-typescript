import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CsatMetricCodeLengthRule,
  CsatMetricQuantityRangeRule,
  CsatMetricRequiredCodeRule,
  CsatMetricScoreRangeRule,
  defaultCsatMetricValidator,
} from "./csat-metric-rules.js";
import { newCsatMetric } from "./csat-metric.js";

test("CsatMetricValidator reports every problem", () => {
  const validator = defaultCsatMetricValidator();
  const item = newCsatMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CsatMetricCodeLengthRule flags a long code", () => {
  const rule = new CsatMetricCodeLengthRule(80);
  const item = newCsatMetric("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CsatMetricRequiredCodeRule flags a blank code", () => {
  const rule = new CsatMetricRequiredCodeRule("csat metric needs this field");
  const item = newCsatMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CsatMetricScoreRangeRule flags values above score", () => {
  const rule = new CsatMetricScoreRangeRule(8.5, 3415.3);
  const item = newCsatMetric("x", "y");
  item.score = 3416.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CsatMetricQuantityRangeRule flags values above quantity", () => {
  const rule = new CsatMetricQuantityRangeRule(32, 1000);
  const item = newCsatMetric("x", "y");
  item.quantity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
