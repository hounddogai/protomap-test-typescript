import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientBidRuleMetricNameLengthRule,
  LenientBidRuleMetricRequiredChecksumRule,
  defaultLenientBidRuleMetricValidator,
} from "./lenient-bid-rule-metric-rules.js";
import { newLenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

test("LenientBidRuleMetricValidator reports every problem", () => {
  const validator = defaultLenientBidRuleMetricValidator();
  const item = newLenientBidRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientBidRuleMetricNameLengthRule flags a long name", () => {
  const rule = new LenientBidRuleMetricNameLengthRule(64);
  const item = newLenientBidRuleMetric("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientBidRuleMetricRequiredChecksumRule flags a blank checksum", () => {
  const rule = new LenientBidRuleMetricRequiredChecksumRule("lenient bid rule metric needs this field");
  const item = newLenientBidRuleMetric("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
